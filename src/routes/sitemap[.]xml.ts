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
  { path: "/compare", changefreq: "weekly", priority: "0.7" },
  { path: "/calendar", changefreq: "daily", priority: "0.7" },
  { path: "/status", changefreq: "daily", priority: "0.5" },
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

        const urls = [...entries, ...dayEntries].map((e) =>
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
