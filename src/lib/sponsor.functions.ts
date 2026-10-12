import { createServerFn } from "@tanstack/react-start";
import type Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";
import { SPONSOR_PRICE_IDS } from "@/lib/sponsor-plans";

const envOk = (e: unknown): e is StripeEnv => e === "sandbox" || e === "live";

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string | undefined; userId?: string | undefined },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");
  if (options.userId) {
    const found = await stripe.customers.search({ query: `metadata['userId']:'${options.userId}'`, limit: 1 });
    const hit = found.data[0];
    if (hit) return hit.id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      if (options.userId && customer.metadata?.["userId"] !== options.userId) {
        await stripe.customers.update(customer.id, { metadata: { ...customer.metadata, userId: options.userId } });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export const createSponsorCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { priceId: string; returnUrl: string; environment: StripeEnv }) => {
    if (!(SPONSOR_PRICE_IDS as readonly string[]).includes(d.priceId)) throw new Error("Invalid plan");
    if (!envOk(d.environment)) throw new Error("Invalid environment");
    if (typeof d.returnUrl !== "string" || d.returnUrl.length > 500) throw new Error("Invalid return URL");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ clientSecret: string } | { error: string }> => {
    try {
      const { data: existing } = await context.supabase
        .from("subscriptions")
        .select("status,current_period_end")
        .eq("user_id", context.userId)
        .eq("environment", data.environment)
        .in("status", ["active", "trialing", "past_due"]);
      if (existing && existing.length) return { error: "You already have an active plan — use Manage subscription to change it." };

      const { data: u } = await context.supabase.auth.getUser();
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const price = prices.data[0];
      if (!price) return { error: "Plan not found" };
      const customerId = await resolveOrCreateCustomer(stripe, { email: u.user?.email ?? undefined, userId: context.userId });
      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        managed_payments: { enabled: true },
        metadata: { userId: context.userId, managed_payments: "true" },
        subscription_data: { metadata: { userId: context.userId } },
      } as Stripe.Checkout.SessionCreateParams);
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createSponsorPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { returnUrl: string; environment: StripeEnv }) => {
    if (!envOk(d.environment)) throw new Error("Invalid environment");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_customer_id) return { error: "No subscription found" };
    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: data.returnUrl });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/** The signed-in sponsor's own row + subscription for the current environment. */
export const getMySponsorship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { environment: StripeEnv }) => {
    if (!envOk(d.environment)) throw new Error("Invalid environment");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: sub } = await context.supabase
      .from("subscriptions")
      .select("price_id,status,current_period_end,cancel_at_period_end")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data: sponsor } = await context.supabase
      .from("sponsors")
      .select("id,name,url,tagline,approved,paid,plan")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return { sub, sponsor };
  });

export const saveSponsorDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { environment: StripeEnv; name: string; url: string; tagline?: string }) => {
    if (!envOk(d.environment)) throw new Error("Invalid environment");
    const name = String(d.name ?? "").trim().slice(0, 80);
    const url = String(d.url ?? "").trim().slice(0, 300);
    const tagline = String(d.tagline ?? "").trim().slice(0, 80);
    if (!name) throw new Error("Name is required");
    if (!/^https:\/\/[^\s]+$/.test(url)) throw new Error("Link must start with https://");
    return { environment: d.environment, name, url, tagline };
  })
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("sponsors")
      .select("id,plan")
      .eq("user_id", context.userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!row) return { error: "No paid plan found yet — give it a few seconds after paying." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("sponsors")
      .update({
        name: data.name,
        url: data.url,
        tagline: row.plan === "sponsor" ? data.tagline || null : null,
        approved: false,
        active: false,
      })
      .eq("id", row.id);
    return error ? { error: "Couldn't save" } : { ok: true as const };
  });

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const listSponsorsAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sponsors } = await supabaseAdmin
      .from("sponsors")
      .select("id,name,url,tagline,plan,approved,paid,active,environment,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    const { data: enquiries } = await supabaseAdmin
      .from("sponsor_enquiries")
      .select("id,name,email,company,website,message,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    return { sponsors: sponsors ?? [], enquiries: enquiries ?? [] };
  });

export const setSponsorApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; approved: boolean }) => {
    if (!/^[0-9a-f-]{36}$/.test(d.id)) throw new Error("Invalid id");
    return { id: d.id, approved: Boolean(d.approved) };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("sponsors").update({ approved: data.approved, active: data.approved }).eq("id", data.id);
    return { ok: true };
  });
