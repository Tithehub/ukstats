import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const BASE_URL = "https://ukstats.co.uk";

function esc(v: string) {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** RSS of every official UK figure that changed, newest first. */
export const Route = createFileRoute("/feed.xml")({
  server: {
    handlers: {
      GET: async () => {
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

        const { data } = await supabase
          .from("metric_changes")
          .select("*")
          .order("detected_at", { ascending: false })
          .limit(50);

        const items = (data ?? []).map((c) => {
          const link = `${BASE_URL}/history/${c.metric_id}`;
          const desc =
            `${c.title}: ${c.value ?? "not published"}${c.period ? ` (${c.period})` : ""}. ` +
            `${c.previous_value ? `Previously ${c.previous_value}. ` : ""}` +
            `Published by ${c.source}. Source: ${c.source_url}`;
          return [
            "    <item>",
            `      <title>${esc(`${c.title}: ${c.value ?? "not published"}`)}</title>`,
            `      <link>${esc(link)}</link>`,
            `      <guid isPermaLink="false">${esc(c.id)}</guid>`,
            `      <category>${esc(c.category)}</category>`,
            `      <pubDate>${new Date(c.detected_at).toUTCString()}</pubDate>`,
            `      <description>${esc(desc)}</description>`,
            "    </item>",
          ].join("\n");
        });

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
          "  <channel>",
          "    <title>UKStats — newly published UK figures</title>",
          `    <link>${BASE_URL}/</link>`,
          "    <description>Every official UK statistic that changed, with its reference period and a link to the issuing body's own release. Nothing estimated.</description>",
          "    <language>en-GB</language>",
          `    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />`,
          ...items,
          "  </channel>",
          "</rss>",
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=900" },
        });
      },
    },
  },
});
