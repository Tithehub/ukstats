import { createServerFn } from "@tanstack/react-start";
import { BANNER_BUCKET, BANNER_URL_SECONDS } from "@/lib/banner-paths";
import { visibleSponsors, withBannerLinks, type SponsorBannerRow, type SponsorVisibilityRow } from "@/lib/sponsor-visibility";

/**
 * Short-lived web addresses for the banner pictures of sponsors who are
 * allowed to show. The picture folder itself is private, so this is the only
 * way a visitor's browser can display one — and it hands out nothing but
 * approved, switched-on, paid-for lines from the visitor's own environment.
 */
export const getSponsorBannerLinks = createServerFn({ method: "POST" })
  .inputValidator((d: { environment: unknown }) => {
    if (d.environment !== "live" && d.environment !== "sandbox") throw new Error("Invalid environment");
    return { environment: d.environment };
  })
  .handler(async ({ data }): Promise<{ links: { id: string; url: string }[] }> => {
    type Row = SponsorVisibilityRow & { banner_path: string | null };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("sponsors")
      .select("id,name,url,tagline,approved,active,paid,environment,starts_at,ends_at,banner_path")
      .not("banner_path", "is", null)
      .limit(200);
    const visible = visibleSponsors((rows ?? []) as Row[], data.environment);
    if (!visible.length) return { links: [] };

    const paths = visible.map((r) => r.banner_path).filter((p): p is string => Boolean(p));
    const signed = await supabaseAdmin.storage.from(BANNER_BUCKET).createSignedUrls(paths, BANNER_URL_SECONDS);
    const urlByPath = new Map<string, string>();
    const issued = signed.data ?? [];
    for (const entry of issued) {
      if (entry.path && entry.signedUrl) urlByPath.set(entry.path, entry.signedUrl);
    }
    const links = visible.flatMap((r) => {
      const url = r.banner_path ? urlByPath.get(r.banner_path) : undefined;
      return url ? [{ id: r.id, url }] : [];
    });
    return { links };
  });

/**
 * The whole banner board for one environment: every sponsor line allowed to
 * show, each with its picture already addressed. The home page asks for this
 * while the page is being written out, so the banner is part of the page
 * itself — a visitor whose browser never starts the interactive layer still
 * sees the sponsor they paid for.
 */
export const getSponsorBannerBoard = createServerFn({ method: "POST" })
  .inputValidator((d: { environment: unknown }) => {
    if (d.environment !== "live" && d.environment !== "sandbox") throw new Error("Invalid environment");
    return { environment: d.environment };
  })
  .handler(async ({ data }): Promise<{ sponsors: SponsorBannerRow[] }> => {
    type BoardRow = Omit<SponsorBannerRow, "banner_link">;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("sponsors")
      .select("id,name,url,tagline,approved,active,paid,environment,starts_at,ends_at,region,regions,plan,banner_url,banner_path")
      .limit(200);
    const visible = visibleSponsors((rows ?? []) as BoardRow[], data.environment);
    if (!visible.length) return { sponsors: [] };

    const paths = visible.map((r) => r.banner_path).filter((p): p is string => Boolean(p));
    const urlByPath = new Map<string, string>();
    if (paths.length) {
      const signed = await supabaseAdmin.storage.from(BANNER_BUCKET).createSignedUrls(paths, BANNER_URL_SECONDS);
      for (const entry of signed.data ?? []) {
        if (entry.path && entry.signedUrl) urlByPath.set(entry.path, entry.signedUrl);
      }
    }
    return { sponsors: withBannerLinks(visible, urlByPath) };
  });

