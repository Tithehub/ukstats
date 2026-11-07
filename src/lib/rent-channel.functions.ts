import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { clampChannel, isChannelLive, NO_ENTITLEMENT, slugify, validSlug, type ChannelSettings, type Entitlement } from "@/lib/rent-entitlements";

export interface PublicChannel extends ChannelSettings { live: boolean }

const pickEnt = (e: Partial<Entitlement> | null | undefined): Entitlement => ({
  active: !!e?.active, max_countries: e?.max_countries ?? 1, all_countries: !!e?.all_countries,
  ai_presenter: !!e?.ai_presenter, no_sponsor_box: !!e?.no_sponsor_box, expires_at: e?.expires_at ?? null,
});

/** The signed-in customer's channel, entitlement and whether they are an admin. */
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
    return { channel: ch as (ChannelSettings & { slug: string }) | null, entitlement: e, live: isChannelLive(e, new Date()), isAdmin: !!isAdmin };
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
    const { data: ent } = await supabase.from("rent_entitlements").select("*").eq("user_id", userId).maybeSingle();
    const s = clampChannel(data, pickEnt(ent));
    const { error } = await supabase.from("rent_channels").upsert({ ...s, user_id: userId }, { onConflict: "user_id" });
    if (error) return { error: error.code === "23505" ? "That web address is taken — try another." : "Could not save your channel." };
    return { ok: true, slug: s.slug };
  });

/** Public, safe view of a channel for its stream/watch pages. Settings re-clamped to the entitlement. */
export const getPublicChannel = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string }) => {
    if (typeof d?.slug !== "string" || !validSlug(d.slug)) throw new Error("Invalid channel");
    return d;
  })
  .handler(async ({ data }): Promise<PublicChannel | null> => {
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
    const { data: rows, error } = await sb.rpc("get_public_rent_channel", { _slug: data.slug });
    if (error) throw new Error("Channel lookup failed");
    const r = rows?.[0];
    if (!r) return null;
    const e = pickEnt({ active: r.active, expires_at: r.expires_at, max_countries: r.max_countries, all_countries: r.ent_all_countries, ai_presenter: r.ai_presenter, no_sponsor_box: r.no_sponsor_box });
    const s = clampChannel(r as unknown as ChannelSettings, e);
    return { ...s, live: isChannelLive(e, new Date()) };
  });

/** Admin: list channels with entitlements. */
export const adminListChannels = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const [{ data: chans }, { data: ents }] = await Promise.all([
      context.supabase.from("rent_channels").select("user_id,slug,display_name,created_at").order("created_at", { ascending: false }),
      context.supabase.from("rent_entitlements").select("*"),
    ]);
    return (chans ?? []).map((c) => ({ ...c, entitlement: pickEnt(ents?.find((e) => e.user_id === c.user_id) ?? NO_ENTITLEMENT) }));
  });

/** Admin: grant or change a customer's features by hand (until checkout is live). */
export const adminSetEntitlement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string } & Entitlement) => {
    if (!/^[0-9a-f-]{36}$/.test(d.userId)) throw new Error("Invalid user");
    const n = Math.round(Number(d.max_countries));
    if (!(n >= 1 && n <= 300)) throw new Error("Invalid country count");
    return { ...d, max_countries: n };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await context.supabase.from("rent_entitlements").upsert({
      user_id: data.userId, active: !!data.active, max_countries: data.max_countries, all_countries: !!data.all_countries,
      ai_presenter: !!data.ai_presenter, no_sponsor_box: !!data.no_sponsor_box, expires_at: data.expires_at || null,
      source: "manual", updated_at: new Date().toISOString(),
    });
    if (error) return { error: "Could not save" };
    return { ok: true };
  });
