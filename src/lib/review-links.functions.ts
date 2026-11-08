import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { normaliseReviewUrl, REVIEW_LABELS, REVIEW_PLATFORMS, type DirectoryReview, type ReviewPlatform } from "@/lib/review-links";
import { domainOf } from "@/lib/directory";

const UUID = /^[0-9a-f-]{36}$/;
const isPlatform = (p: unknown): p is ReviewPlatform => typeof p === "string" && (REVIEW_PLATFORMS as readonly string[]).includes(p);

/** Caller's own review links for their sponsor row. */
export const getMyReviewLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sponsorId: string }) => { if (!UUID.test(d.sponsorId)) throw new Error("Invalid id"); return d; })
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase.from("sponsor_review_links").select("platform,url,status").eq("sponsor_id", data.sponsorId);
    return (rows ?? []) as { platform: ReviewPlatform; url: string; status: string }[];
  });

/** Save (or clear) the caller's links; every change goes back to "pending" (database guard). */
export const saveReviewLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sponsorId: string; links: Record<string, string> }) => {
    if (!UUID.test(d.sponsorId)) throw new Error("Invalid id");
    const links: Partial<Record<ReviewPlatform, string>> = {};
    for (const [k, v] of Object.entries(d.links ?? {})) if (isPlatform(k) && typeof v === "string") links[k] = v.slice(0, 500);
    return { sponsorId: d.sponsorId, links };
  })
  .handler(async ({ data, context }): Promise<{ ok: true } | { error: string }> => {
    const { data: sponsor } = await context.supabase.from("sponsors").select("id,url").eq("id", data.sponsorId).eq("user_id", context.userId).maybeSingle();
    if (!sponsor) return { error: "Sponsorship not found." };
    const { data: existing } = await context.supabase.from("sponsor_review_links").select("platform,url").eq("sponsor_id", sponsor.id);
    const have = new Map((existing ?? []).map((r) => [r.platform, r.url]));
    for (const p of REVIEW_PLATFORMS) {
      const raw = (data.links[p] ?? "").trim();
      if (!raw) { if (have.has(p)) await context.supabase.from("sponsor_review_links").delete().eq("sponsor_id", sponsor.id).eq("platform", p); continue; }
      const r = normaliseReviewUrl(p, raw, domainOf(sponsor.url));
      if ("error" in r) return { error: r.error };
      if (have.get(p) === r.url) continue;
      const { error } = await context.supabase.from("sponsor_review_links").upsert({ sponsor_id: sponsor.id, platform: p, url: r.url }, { onConflict: "sponsor_id,platform" });
      if (error) return { error: `Couldn't save your ${REVIEW_LABELS[p]} link.` };
    }
    return { ok: true };
  });

async function assertAdmin(supabase: { rpc: (fn: "has_role", a: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: boolean | null }> }, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const listReviewLinksAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("sponsor_review_links").select("id,sponsor_id,platform,url,status,updated_at").order("updated_at", { ascending: false }).limit(300);
    return data ?? [];
  });

export const setReviewLinkStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "approved" | "rejected" }) => {
    if (!UUID.test(d.id) || (d.status !== "approved" && d.status !== "rejected")) throw new Error("Invalid input");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("sponsor_review_links").update({ status: data.status }).eq("id", data.id);
    return { ok: true };
  });

/** Public: approved review links for the given (already visible) sponsors. Public URLs only. */
export const getDirectoryReviews = createServerFn({ method: "POST" })
  .inputValidator((d: { ids: string[] }) => ({ ids: (Array.isArray(d.ids) ? d.ids : []).filter((x) => typeof x === "string" && UUID.test(x)).slice(0, 200) }))
  .handler(async ({ data }): Promise<Record<string, DirectoryReview[]>> => {
    if (!data.ids.length) return {};
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.from("sponsor_review_links").select("sponsor_id,platform,url").eq("status", "approved").in("sponsor_id", data.ids);
    const out: Record<string, DirectoryReview[]> = {};
    for (const r of rows ?? []) {
      if (!isPlatform(r.platform)) continue;
      (out[r.sponsor_id] ??= []).push({ platform: r.platform, label: REVIEW_LABELS[r.platform], url: r.url });
    }
    return out;
  });
