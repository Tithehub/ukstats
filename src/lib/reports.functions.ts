import { createServerFn } from "@tanstack/react-start";
import type Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canDownload, isReportPriceId, REPORT_PRICES, reportFileName, type ReportEdition, type ReportKind, type ReportPriceId, type ReportPurchase, type ReportSub } from "@/lib/reports";
import type { StripeEnv } from "@/lib/stripe.server";

const envOk = (e: unknown): e is StripeEnv => e === "sandbox" || e === "live";
const dateOk = (d: unknown): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);
const editionOk = (e: unknown): e is ReportEdition => e === "uk" || e === "global";
const kindOk = (k: unknown): k is ReportKind => k === "daily" || k === "weekly" || k === "monthly";
const today = async () => (await import("@/lib/daily")).londonDate();

export interface ReportEditionRow { edition: ReportEdition; kind: ReportKind; report_date: string; pages: number | null }

/** Public archive of built editions (no file access). */
export const listReportEditions = createServerFn({ method: "POST" }).handler(async (): Promise<{ editions: ReportEditionRow[]; today: string }> => {
  const { createClient } = await import("@supabase/supabase-js");
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const sb = createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const h = new Headers(init?.headers);
      if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
      h.set("apikey", key);
      return fetch(input, { ...init, headers: h });
    } },
  });
  const { data } = await sb.from("report_editions").select("edition,kind,report_date,pages").order("report_date", { ascending: false }).limit(120);
  return { editions: (data ?? []) as ReportEditionRow[], today: await today() };
});

export interface MyReportAccess { purchases: ReportPurchase[]; subs: (ReportSub & { price_id: string; cancel_at_period_end: boolean })[] }

export const getMyReportAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { environment: StripeEnv }) => { if (!envOk(d.environment)) throw new Error("Invalid environment"); return d; })
  .handler(async ({ data, context }): Promise<MyReportAccess> => {
    const [p, s] = await Promise.all([
      context.supabase.from("report_purchases").select("edition,report_date").eq("user_id", context.userId).eq("environment", data.environment),
      context.supabase.from("report_subscriptions").select("edition,status,current_period_start,current_period_end,price_id,cancel_at_period_end").eq("user_id", context.userId).eq("environment", data.environment).order("created_at", { ascending: false }),
    ]);
    return { purchases: (p.data ?? []) as ReportPurchase[], subs: (s.data ?? []) as MyReportAccess["subs"] };
  });

async function resolveCustomer(stripe: Stripe, userId: string, email?: string): Promise<string> {
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) throw new Error("Invalid userId");
  const found = await stripe.customers.search({ query: `metadata['userId']:'${userId}'`, limit: 1 });
  if (found.data[0]) return found.data[0].id;
  if (email) {
    const existing = (await stripe.customers.list({ email, limit: 1 })).data[0];
    if (existing) {
      if (existing.metadata?.["userId"] !== userId) await stripe.customers.update(existing.id, { metadata: { ...existing.metadata, userId } });
      return existing.id;
    }
  }
  return (await stripe.customers.create({ ...(email && { email }), metadata: { userId } })).id;
}

export const createReportCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { priceId: ReportPriceId; date?: string | undefined; returnUrl: string; environment: StripeEnv }) => {
    if (!envOk(d.environment)) throw new Error("Invalid environment");
    if (!isReportPriceId(d.priceId)) throw new Error("Invalid plan");
    if (d.date !== undefined && !dateOk(d.date)) throw new Error("Invalid date");
    if (typeof d.returnUrl !== "string" || d.returnUrl.length > 500) throw new Error("Invalid return URL");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ clientSecret: string } | { error: string }> => {
    const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");
    const plan = REPORT_PRICES[data.priceId];
    const date = data.date ?? (await today());
    try {
      if (!plan.interval) {
        if (date > (await today())) return { error: "That report has not been published yet." };
        const { data: owned } = await context.supabase.from("report_purchases").select("edition").eq("user_id", context.userId).eq("environment", data.environment).eq("report_date", date);
        if ((owned ?? []).some((o) => o.edition === plan.edition || o.edition === "global")) return { error: "You already own this report — download it below." };
      } else {
        const { data: subs } = await context.supabase.from("report_subscriptions").select("status,current_period_end,edition").eq("user_id", context.userId).eq("environment", data.environment);
        if ((subs ?? []).some((s) => ["active", "trialing", "past_due"].includes(s.status))) return { error: "You already have a reports subscription — use Manage subscription to change it." };
      }
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      const price = prices.data[0];
      if (!price) return { error: "Report prices are not set up yet." };
      const { data: u } = await context.supabase.auth.getUser();
      const customer = await resolveCustomer(stripe, context.userId, u.user?.email ?? undefined);
      const meta = { userId: context.userId, kind: plan.interval ? "report_sub" : "report", edition: plan.edition, ...(plan.interval ? {} : { reportDate: date }) };
      const params: Record<string, unknown> = {
        line_items: [{ price: price.id, quantity: 1 }],
        mode: plan.interval ? "subscription" : "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer,
        managed_payments: { enabled: true },
        metadata: meta,
        ...(plan.interval
          ? { subscription_data: { metadata: meta } }
          : { payment_intent_data: { description: `${plan.label} — ${date}` } }),
      };
      const session = await stripe.checkout.sessions.create(params as unknown as Stripe.Checkout.SessionCreateParams);
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/** Returns a 60-second private link to a report the caller is entitled to. */
export const getReportDownload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { edition: ReportEdition; kind: ReportKind; date: string; environment: StripeEnv }) => {
    if (!envOk(d.environment) || !editionOk(d.edition) || !kindOk(d.kind) || !dateOk(d.date)) throw new Error("Invalid request");
    return d;
  })
  .handler(async ({ data, context }): Promise<{ url: string; fileName: string } | { error: string }> => {
    const [p, s] = await Promise.all([
      context.supabase.from("report_purchases").select("edition,report_date").eq("user_id", context.userId).eq("environment", data.environment),
      context.supabase.from("report_subscriptions").select("edition,status,current_period_start,current_period_end").eq("user_id", context.userId).eq("environment", data.environment),
    ]);
    if (!canDownload(data, (p.data ?? []) as ReportPurchase[], (s.data ?? []) as ReportSub[])) return { error: "This report isn't included in your purchases." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("report_editions").select("storage_path").eq("edition", data.edition).eq("kind", data.kind).eq("report_date", data.date).maybeSingle();
    let path = row?.storage_path;
    if (!path) {
      if (data.date !== (await today())) return { error: "No report was built for that day." };
      try {
        const { generateEdition } = await import("@/lib/reports.server");
        path = await generateEdition(data.edition, data.kind, data.date);
      } catch (e) {
        console.error("report build failed", e);
        return { error: "Today's report is still being prepared — try again in a minute." };
      }
    }
    const fileName = reportFileName(data.edition, data.kind, data.date);
    const { data: signed, error } = await supabaseAdmin.storage.from("reports").createSignedUrl(path, 60, { download: fileName });
    if (error || !signed) return { error: "Could not prepare the download." };
    return { url: signed.signedUrl, fileName };
  });

export const createReportPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { returnUrl: string; environment: StripeEnv }) => { if (!envOk(d.environment)) throw new Error("Invalid environment"); return d; })
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");
    const { data: sub } = await context.supabase.from("report_subscriptions").select("stripe_customer_id").eq("user_id", context.userId).eq("environment", data.environment).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!sub?.stripe_customer_id) return { error: "No subscription found" };
    try {
      const portal = await createStripeClient(data.environment).billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: data.returnUrl });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
