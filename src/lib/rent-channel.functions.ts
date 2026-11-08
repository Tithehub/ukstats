import { createServerFn } from "@tanstack/react-start";
import type Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { clampChannel, isChannelLive, NO_ENTITLEMENT, WISH_ENTITLEMENT, slugify, validSlug, type ChannelSettings, type Entitlement } from "@/lib/rent-entitlements";
import { FOUNDING_RENT_SLOTS, normalisePlan, RENT_PRICE_IDS, rentLineItems, type RentPlan } from "@/lib/rent-checkout";
import type { StripeEnv } from "@/lib/stripe.server";
import { assertReturnUrl } from "@/lib/safe-url";

export type ChannelStatus = "draft" | "pending" | "active" | "paused";
export interface PublicChannel extends ChannelSettings { live: boolean; preview?: boolean }

const LOGO_BUCKET = "rent-logos";
const envOk = (e: unknown): e is StripeEnv => e === "sandbox" || e === "live";

const pickEnt = (e: Partial<Entitlement> | null | undefined): Entitlement => ({
  active: !!e?.active, max_countries: e?.max_countries ?? 1, all_countries: !!e?.all_countries,
  ai_presenter: !!e?.ai_presenter, no_sponsor_box: !!e?.no_sponsor_box, expires_at: e?.expires_at ?? null,
});

function publicClient() {
  return import("@supabase/supabase-js").then(({ createClient }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    return createClient(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      } },
    });
  });
}

/** Uploaded logos are stored as "storage:<uid>/<file>" and served as a signed link. */
async function signLogo(sb: { storage: { from: (b: string) => { createSignedUrl: (p: string, s: number) => Promise<{ data: { signedUrl: string } | null }> } } }, v: string | null): Promise<string | null> {
  if (!v?.startsWith("storage:")) return v;
  const { data } = await sb.storage.from(LOGO_BUCKET).createSignedUrl(v.slice(8), 7 * 86_400);
  return data?.signedUrl ?? null;
}

/** The signed-in customer's channel, entitlement, billing state and admin flag. */
export const getMyChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: ch }, { data: ent }, { data: isAdmin }] = await Promise.all([
      supabase.from("rent_channels").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("rent_entitlements").select("*").eq("user_id", userId).maybeSingle(),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    ]);
    const e = pickEnt(ent);
    const channel = ch ? { ...(ch as unknown as ChannelSettings), status: (ch.status as ChannelStatus), logo_preview: await signLogo(supabase as never, ch.logo_url) } : null;
    return {
      channel, entitlement: e, live: isChannelLive(e, new Date()), isAdmin: !!isAdmin,
      billing: ent ? { source: ent.source, status: ent.sub_status, cancelAtPeriodEnd: ent.cancel_at_period_end, hasStripe: !!ent.stripe_customer_id, environment: ent.environment } : null,
    };
  });

export const checkSlug = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string }) => ({ slug: slugify(String(d?.slug ?? "")) }))
  .handler(async ({ data, context }) => {
    if (!validSlug(data.slug)) return { slug: data.slug, ok: false, reason: "Use 3–40 letters, numbers or dashes" };
    const { data: free } = await context.supabase.rpc("rent_slug_available", { _slug: data.slug });
    return { slug: data.slug, ok: !!free, reason: free ? "Available" : "Already taken" };
  });

export const saveMyChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: ChannelSettings) => {
    if (!d || typeof d.display_name !== "string" || !Array.isArray(d.countries)) throw new Error("Invalid settings");
    const slug = slugify(d.slug || d.display_name);
    if (!validSlug(slug)) throw new Error("Choose a web address of 3–40 letters, numbers or dashes");
    return { ...d, slug };
  })
  .handler(async ({ data, context }): Promise<{ ok: true; slug: string } | { error: string }> => {
    const { supabase, userId } = context;
    // Store the customer's wishes; the live stream is clamped to what they've paid for on every read.
    const s = clampChannel(data, WISH_ENTITLEMENT, userId);
    const { error } = await supabase.from("rent_channels").upsert({ ...s, user_id: userId }, { onConflict: "user_id" });
    if (error) return { error: error.code === "23505" ? "That web address is taken — try another." : "Could not save your channel." };
    return { ok: true, slug: s.slug };
  });

/** Owner asks for their channel to be switched on (draft/paused -> pending). */
export const requestActivation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.from("rent_channels")
      .update({ status: "pending", requested_at: new Date().toISOString() })
      .eq("user_id", context.userId).in("status", ["draft", "paused"]);
    return error ? { error: "Could not send request" } : { ok: true };
  });

/** Public, safe view of a channel. Owners (and admins) may pass preview to see it before it is live. */
export const getPublicChannel = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string }) => {
    if (typeof d?.slug !== "string" || !validSlug(d.slug)) throw new Error("Invalid channel");
    return d;
  })
  .handler(async ({ data }): Promise<PublicChannel | null> => {
    const sb = await publicClient();
    const { data: rows, error } = await sb.rpc("get_public_rent_channel", { _slug: data.slug });
    if (error) throw new Error("Channel lookup failed");
    const r = rows?.[0];
    if (!r) return null;
    const e = pickEnt({ active: r.active, expires_at: r.expires_at, max_countries: r.max_countries, all_countries: r.ent_all_countries, ai_presenter: r.ai_presenter, no_sponsor_box: r.no_sponsor_box });
    const s = clampChannel(r as unknown as ChannelSettings, e);
    // Logos are private; sign only this channel's own logo server-side.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return { ...s, logo_url: await signLogo(supabaseAdmin as never, s.logo_url), live: isChannelLive(e, new Date()) };
  });

/** Owner/admin preview of a channel that is not live yet. Checked through the caller's session. */
export const getPreviewChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { slug: string }) => {
    if (typeof d?.slug !== "string" || !validSlug(d.slug)) throw new Error("Invalid channel");
    return d;
  })
  .handler(async ({ data, context }): Promise<PublicChannel | null> => {
    const { data: ch } = await context.supabase.from("rent_channels").select("*").eq("slug", data.slug).maybeSingle();
    if (!ch) return null; // RLS: only the owner or an admin can read it
    const { data: ent } = await context.supabase.from("rent_entitlements").select("*").eq("user_id", ch.user_id).maybeSingle();
    const e = pickEnt(ent);
    const s = clampChannel(ch as unknown as ChannelSettings, WISH_ENTITLEMENT);
    return { ...s, logo_url: await signLogo(context.supabase as never, s.logo_url), live: isChannelLive(e, new Date()), preview: true };
  });

/** Admin: every channel with owner email, status and entitlement. */
export const adminListChannels = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const [{ data: chans }, { data: ents }] = await Promise.all([
      context.supabase.rpc("admin_rent_channels"),
      context.supabase.from("rent_entitlements").select("*"),
    ]);
    return (chans ?? []).map((c) => {
      const raw = ents?.find((e) => e.user_id === c.user_id);
      return { ...c, source: raw?.source ?? null, entitlement: pickEnt(raw ?? NO_ENTITLEMENT) };
    });
  });

/** Admin: approve (active) or pause a channel, optionally changing its features. Manual grants mark the row 'manual'. */
export const adminSetEntitlement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; status?: ChannelStatus } & Entitlement) => {
    if (!/^[0-9a-f-]{36}$/.test(d.userId)) throw new Error("Invalid user");
    const n = Math.round(Number(d.max_countries));
    if (!(n >= 1 && n <= 300)) throw new Error("Invalid country count");
    if (d.status && !["active", "paused"].includes(d.status)) throw new Error("Invalid status");
    return { ...d, max_countries: n };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const active = data.status ? data.status === "active" : !!data.active;
    const { error } = await context.supabase.from("rent_entitlements").upsert({
      user_id: data.userId, active, max_countries: data.max_countries, all_countries: !!data.all_countries,
      ai_presenter: !!data.ai_presenter, no_sponsor_box: !!data.no_sponsor_box, expires_at: data.expires_at || null,
      source: "manual", updated_at: new Date().toISOString(),
    });
    if (error) return { error: "Could not save" };
    await context.supabase.from("rent_channels").update({ status: active ? "active" : "paused" }).eq("user_id", data.userId);
    return { ok: true };
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

/** Monthly rented-stream subscription built from the plan choices. */
export const createRentCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { plan: RentPlan; returnUrl: string; environment: StripeEnv }) => {
    if (!envOk(d.environment)) throw new Error("Invalid environment");
    return { ...d, returnUrl: assertReturnUrl(d.returnUrl), plan: normalisePlan(d.plan) };
  })
  .handler(async ({ data, context }): Promise<{ clientSecret: string } | { error: string }> => {
    const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");
    try {
      const { data: ent } = await context.supabase.from("rent_entitlements").select("sub_status,stripe_subscription_id,environment").eq("user_id", context.userId).maybeSingle();
      if (ent?.stripe_subscription_id && ent.environment === data.environment && ["active", "trialing", "past_due"].includes(ent.sub_status ?? ""))
        return { error: "You already have a stream plan — use Manage billing to change it." };
      const { data: ch } = await context.supabase.from("rent_channels").select("slug").eq("user_id", context.userId).maybeSingle();
      if (!ch) return { error: "Save your channel first." };

      const stripe = createStripeClient(data.environment);
      const items = rentLineItems(data.plan);
      const prices = await stripe.prices.list({ lookup_keys: RENT_PRICE_IDS, limit: 10 });
      const byKey = new Map(prices.data.map((p) => [p.lookup_key, p.id]));
      const line_items = items.map((i) => ({ price: byKey.get(i.price)!, quantity: i.quantity }));
      if (line_items.some((l) => !l.price)) return { error: "Plan prices are not set up yet." };

      // Founding offer: 25% off for the first ten rented streams.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { count } = await supabaseAdmin.from("rent_entitlements").select("user_id", { count: "exact", head: true }).eq("source", "stripe").eq("environment", data.environment);
      let discounts: { coupon: string }[] | undefined;
      if ((count ?? 0) < FOUNDING_RENT_SLOTS) {
        const id = "rent_founding_25";
        try { await stripe.coupons.retrieve(id); } catch { await stripe.coupons.create({ id, percent_off: 25, duration: "forever", name: "Founding streamer — 25% off" }); }
        discounts = [{ coupon: id }];
      }

      const { data: u } = await context.supabase.auth.getUser();
      const customer = await resolveCustomer(stripe, context.userId, u.user?.email ?? undefined);
      const session = await stripe.checkout.sessions.create({
        line_items, mode: "subscription", ui_mode: "embedded_page", return_url: data.returnUrl, customer,
        managed_payments: { enabled: true },
        ...(discounts && { discounts }),
        metadata: { userId: context.userId, kind: "rent", managed_payments: "true" },
        subscription_data: { metadata: { userId: context.userId, kind: "rent", slug: ch.slug } },
      } as Stripe.Checkout.SessionCreateParams);
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createRentPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { returnUrl: string; environment: StripeEnv }) => {
    if (!envOk(d.environment)) throw new Error("Invalid environment");
    return { ...d, returnUrl: assertReturnUrl(d.returnUrl) };
  })
  .handler(async ({ data, context }): Promise<{ url: string } | { error: string }> => {
    const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");
    const { data: ent } = await context.supabase.from("rent_entitlements").select("stripe_customer_id,environment").eq("user_id", context.userId).maybeSingle();
    if (!ent?.stripe_customer_id || ent.environment !== data.environment) return { error: "No stream plan found" };
    try {
      const portal = await createStripeClient(data.environment).billingPortal.sessions.create({ customer: ent.stripe_customer_id, return_url: data.returnUrl });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
