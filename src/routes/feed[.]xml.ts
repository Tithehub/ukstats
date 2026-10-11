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

        const { data: briefings } = await supabase.rpc("list_daily_briefings", { max_rows: 30 });

        const briefingItems = (briefings ?? []).map((b) =>
          [
            "    <item>",
            `      <title>${esc(b.headline)}</title>`,
            `      <link>${esc(`${BASE_URL}/daily/${b.briefing_date}`)}</link>`,
            `      <guid isPermaLink="false">daily-${esc(b.briefing_date)}</guid>`,
            "      <category>Daily statement</category>",
            `      <pubDate>${new Date(b.created_at).toUTCString()}</pubDate>`,
            `      <description>${esc(b.body)}</description>`,
            "    </item>",
          ].join("\n"),
        );

        const { data } = await supabase.rpc("list_recent_changes", { max_rows: 50 });

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
          ...briefingItems,
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
