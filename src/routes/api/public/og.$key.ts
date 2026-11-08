import { createFileRoute } from "@tanstack/react-router";
import { OG_PAGE_METRIC, OG_TITLE_PAGES, ogCardText, type OgFigure } from "@/lib/og-card";
import { brandFromHost, SITES } from "@/lib/site-host";

const KEY = /^[a-z0-9-]{1,80}(:[a-z]{2}:[a-z0-9-]{1,80})?$/;

/** Public share picture (1200×630 PNG) for a figure or page. Reads published snapshots only; returns no private data. */
export const Route = createFileRoute("/api/public/og/$key")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const key = decodeURIComponent(params.key).replace(/\.png$/, "").toLowerCase();
        if (!KEY.test(key)) return new Response("Not found", { status: 404 });
        const brand = brandFromHost(new URL(request.url).hostname);
        const site = SITES[key.includes(":") ? "global" : brand];
        const domain = site.origin.replace(/^https:\/\//, "");
        const { renderFigureCard, renderTitleCard } = await import("@/lib/og-render.server");
        const headers = { "content-type": "image/png", "cache-control": "public, max-age=3600, s-maxage=3600" };

        const page = OG_TITLE_PAGES[key];
        if (page) return new Response(renderTitleCard(page.title, page.subtitle, domain, site.name), { headers });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let fig: OgFigure | null = null;
        if (key.includes(":")) {
          const [, code, metric] = key.split(":");
          const { data } = await supabaseAdmin.from("country_metric_snapshots").select("title, value, period, source, updated_at").eq("code", code!).eq("metric_id", metric!).maybeSingle();
          if (data) fig = { title: data.title ?? metric!, value: data.value, period: data.period, source: data.source, asOf: data.updated_at };
        } else {
          const id = OG_PAGE_METRIC[key] ?? key;
          const { data } = await supabaseAdmin.from("metric_snapshots").select("title, value, period, source, as_of, updated_at").eq("metric_id", id).maybeSingle();
          if (data) fig = { title: data.title, value: data.value, period: data.period, source: data.source, asOf: data.as_of ?? data.updated_at };
        }
        if (!fig) return new Response(renderTitleCard(site.name, site.tagline, domain, site.name), { headers: { ...headers, "cache-control": "public, max-age=300" } });
        return new Response(renderFigureCard(ogCardText(fig), domain, site.name), { headers });
      },
    },
  },
});
