import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { isPaidStatus, planFromPriceId } from "@/lib/sponsor-plans";
import { entitlementFromItems, rentAccessActive } from "@/lib/rent-checkout";

/** Rented streams: Stripe drives rent_entitlements (source 'stripe'); manual grants are never overwritten. */
async function syncRent(subscription: any, env: StripeEnv, deleted = false) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const userId = subscription.metadata?.userId;
  if (!userId) return;
  const { data: existing } = await supabaseAdmin.from("rent_entitlements").select("source").eq("user_id", userId).maybeSingle();
  if (existing?.source === "manual") return;
  const items = (subscription.items?.data ?? []).map((i: any) => ({ lookup: i.price?.lookup_key || i.price?.metadata?.lovable_external_id || null, quantity: i.quantity ?? 1 }));
  const first = subscription.items?.data?.[0];
  const end = first?.current_period_end ?? subscription.current_period_end;
  const periodEnd = end ? new Date(end * 1000) : null;
  const status: string = deleted ? "canceled" : subscription.status;
  const active = rentAccessActive(status, periodEnd, new Date());
  await supabaseAdmin.from("rent_entitlements").upsert({
    user_id: userId, ...entitlementFromItems(items), active, source: "stripe",
    expires_at: status === "canceled" || subscription.cancel_at_period_end ? periodEnd?.toISOString() ?? null : null,
    stripe_subscription_id: subscription.id, stripe_customer_id: subscription.customer, environment: env,
    sub_status: status, cancel_at_period_end: !!subscription.cancel_at_period_end, updated_at: new Date().toISOString(),
  });
  await supabaseAdmin.from("rent_channels").update({ status: active ? "active" : "paused" }).eq("user_id", userId);
}

/** Paid PDF reports: subscriptions unlock every edition until the paid period ends. */
async function syncReportSub(subscription: any, env: StripeEnv, deleted = false) {
  const userId = subscription.metadata?.userId;
  const edition = subscription.metadata?.edition;
  if (!userId || (edition !== "uk" && edition !== "global")) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const item = subscription.items?.data?.[0];
  const start = item?.current_period_start ?? subscription.current_period_start;
  const end = item?.current_period_end ?? subscription.current_period_end;
  await supabaseAdmin.from("report_subscriptions").upsert({
    user_id: userId, edition,
    price_id: item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id || "unknown",
    stripe_subscription_id: subscription.id, stripe_customer_id: subscription.customer,
    status: deleted ? "canceled" : subscription.status,
    current_period_start: start ? new Date(start * 1000).toISOString() : null,
    current_period_end: end ? new Date(end * 1000).toISOString() : null,
    cancel_at_period_end: !!subscription.cancel_at_period_end, environment: env, updated_at: new Date().toISOString(),
  }, { onConflict: "stripe_subscription_id" });
}

async function recordReportPurchase(session: any, env: StripeEnv) {
  const m = session.metadata ?? {};
  if (session.payment_status === "unpaid" || !m.userId || !/^\d{4}-\d{2}-\d{2}$/.test(m.reportDate ?? "") || (m.edition !== "uk" && m.edition !== "global")) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("report_purchases").upsert(
    { user_id: m.userId, edition: m.edition, report_date: m.reportDate, stripe_session_id: session.id, environment: env },
    { onConflict: "stripe_session_id" },
  );
}

async function upsertSubscription(subscription: any, env: StripeEnv) {
  if (subscription.metadata?.kind === "rent") return syncRent(subscription, env);
  if (subscription.metadata?.kind === "report_sub") return syncReportSub(subscription, env);
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
  if (subscription.metadata?.kind === "rent") return syncRent(subscription, env, true);
  if (subscription.metadata?.kind === "report_sub") return syncReportSub(subscription, env, true);
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
            case "checkout.session.completed":
            case "checkout.session.async_payment_succeeded":
              if (event.data.object?.metadata?.kind === "report") await recordReportPurchase(event.data.object, env);
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
