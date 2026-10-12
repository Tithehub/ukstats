import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { isPaidStatus, planFromPriceId } from "@/lib/sponsor-plans";

async function upsertSubscription(subscription: any, env: StripeEnv) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const userId = subscription.metadata?.userId;
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const status: string = subscription.status;

  if (userId) {
    await supabaseAdmin.from("subscriptions").upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        product_id: item?.price?.product,
        price_id: priceId,
        status,
        current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );
  }

  const plan = planFromPriceId(priceId);
  const paid = isPaidStatus(status);
  const { data: existing } = await supabaseAdmin
    .from("sponsors")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  if (existing) {
    // Plan changes apply immediately; downgrading to Supporter drops the tagline.
    await supabaseAdmin
      .from("sponsors")
      .update({ paid, plan, ...(plan === "supporter" ? { tagline: null } : {}) })
      .eq("id", existing.id);
  } else if (userId && plan) {
    await supabaseAdmin.from("sponsors").insert({
      name: "Pending details",
      url: "https://ukstats.co.uk",
      user_id: userId,
      plan,
      stripe_subscription_id: subscription.id,
      environment: env,
      paid,
      approved: false,
      active: false,
      placement: "footer",
    });
  }
}

async function markCanceled(subscription: any, env: StripeEnv) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
  await supabaseAdmin.from("sponsors").update({ paid: false }).eq("stripe_subscription_id", subscription.id);
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") return Response.json({ received: true, ignored: "invalid env" });
        const env: StripeEnv = rawEnv;
        try {
          const event = await verifyWebhook(request, env);
          switch (event.type) {
            case "customer.subscription.created":
            case "customer.subscription.updated":
              await upsertSubscription(event.data.object, env);
              break;
            case "customer.subscription.deleted":
              await markCanceled(event.data.object, env);
              break;
            default:
              break;
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
