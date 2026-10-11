import { COUNTRIES } from "@/lib/countries";
import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const BASE_URL = "https://ukstats.co.uk";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

// Only public, indexable pages. /my-pages and /embed/* are noindex, and
// /p/$slug pages are private, time-limited links.
const entries: SitemapEntry[] = [
  { path: "/", changefreq: "hourly", priority: "1.0" },
  { path: "/register", changefreq: "hourly", priority: "0.9" },
  { path: "/daily", changefreq: "daily", priority: "0.9" },
  { path: "/maps", changefreq: "daily", priority: "0.8" },
  { path: "/tax-vs-welfare", changefreq: "weekly", priority: "0.8" },
  { path: "/foreign-aid", changefreq: "weekly", priority: "0.8" },
  { path: "/polling", changefreq: "daily", priority: "0.8" },
  { path: "/governments", changefreq: "weekly", priority: "0.8" },
  { path: "/widget", changefreq: "monthly", priority: "0.8" },
  { path: "/create", changefreq: "monthly", priority: "0.6" },
  { path: "/support", changefreq: "monthly", priority: "0.5" },
  { path: "/press", changefreq: "monthly", priority: "0.5" },
  { path: "/coverage", changefreq: "weekly", priority: "0.6" },
  { path: "/api-docs", changefreq: "monthly", priority: "0.5" },
  { path: "/countries", changefreq: "weekly", priority: "0.8" },
  { path: "/compare-countries", changefreq: "daily", priority: "0.8" },
  ...COUNTRIES.map((c) => ({ path: `/${c.code}`, changefreq: "daily" as const, priority: "0.7" })),
  { path: "/compare", changefreq: "weekly", priority: "0.7" },
  { path: "/calendar", changefreq: "daily", priority: "0.7" },
  { path: "/status", changefreq: "daily", priority: "0.5" },
  { path: "/regions", changefreq: "weekly", priority: "0.8" },
  { path: "/regions/north-east", changefreq: "weekly", priority: "0.6" },
  { path: "/regions/north-west", changefreq: "weekly", priority: "0.6" },
  { path: "/regions/yorkshire-and-the-humber", changefreq: "weekly", priority: "0.6" },
  { path: "/regions/east-midlands", changefreq: "weekly", priority: "0.6" },
  { path: "/regions/west-midlands", changefreq: "weekly", priority: "0.6" },
  { path: "/regions/east-of-england", changefreq: "weekly", priority: "0.6" },
  { path: "/regions/london", changefreq: "weekly", priority: "0.6" },
  { path: "/regions/south-east", changefreq: "weekly", priority: "0.6" },
  { path: "/regions/south-west", changefreq: "weekly", priority: "0.6" },
  { path: "/regions/scotland", changefreq: "weekly", priority: "0.6" },
  { path: "/regions/wales", changefreq: "weekly", priority: "0.6" },
  { path: "/regions/northern-ireland", changefreq: "weekly", priority: "0.6" },
  { path: "/explained/uk-national-debt", changefreq: "monthly", priority: "0.6" },
  { path: "/explained/uk-cpi", changefreq: "monthly", priority: "0.6" },
  { path: "/explained/uk-unemployment", changefreq: "monthly", priority: "0.6" },
  { path: "/explained/uk-house-prices", changefreq: "monthly", priority: "0.6" },
  { path: "/explained/uk-net-migration", changefreq: "monthly", priority: "0.6" },
  { path: "/explained/uk-irregular-arrivals-ytd", changefreq: "monthly", priority: "0.6" },
  { path: "/explained/uk-terror-threat", changefreq: "monthly", priority: "0.6" },
  { path: "/explained/uk-foreign-aid", changefreq: "monthly", priority: "0.6" },
  { path: "/explained/uk-street-crime", changefreq: "monthly", priority: "0.6" },
  { path: "/explained/uk-population", changefreq: "monthly", priority: "0.6" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Every recorded daily statement is a permanent, indexable page.
        const dayEntries: SitemapEntry[] = [];
        try {
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
          const supabase = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
            auth: { persistSession: false },
            global: {
              fetch: (input, init) => {
                const h = new Headers(init?.headers);
                if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
                h.set("apikey", key);
                return fetch(input, { ...init, headers: h });
              },
            },
          });
          const { data } = await supabase.rpc("list_daily_briefings", { max_rows: 1000 });
          for (const d of data ?? []) {
            dayEntries.push({ path: `/daily/${d.briefing_date}`, changefreq: "never", priority: "0.5" });
          }
        } catch {
          // A sitemap must still render if the archive is briefly unavailable.
        }

        const explained: SitemapEntry[] = [];
        try {
          const { getUkStats } = await import("@/lib/uk-stats.functions");
          const have = new Set(entries.map((e) => e.path));
          for (const m of (await getUkStats()).metrics) {
            const path = `/explained/${m.id}`;
            if (!have.has(path)) { have.add(path); explained.push({ path, changefreq: "monthly", priority: "0.5" }); }
          }
        } catch {
          // Keep the static sitemap if figures are briefly unavailable.
        }

        const urls = [...entries, ...explained, ...dayEntries].map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
