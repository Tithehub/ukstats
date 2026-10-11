import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface FeedStatusRow {
  metricId: string;
  title: string;
  category: string;
  source: string;
  sourceUrl: string;
  status: string;
  note: string | null;
  lastChecked: string;
  /** Checks in the last 30 days that returned a live figure. */
  ok30: number;
  /** Total checks in the last 30 days. */
  total30: number;
}

export interface FeedStatusPayload {
  rows: FeedStatusRow[];
  checksSince: string;
  fetchedAt: string;
}

/**
 * Public feed-health read: the latest check per metric plus 30-day reliability,
 * from the sweep's feed_checks log. Read-only, published figures only.
 */
export const getFeedStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<FeedStatusPayload> => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const db = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
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

    const since = new Date(Date.now() - 30 * 24 * 3600_000).toISOString();
    const { data } = await db.rpc("list_feed_checks", { max_rows: 20000, since });

    const latest = new Map<string, FeedStatusRow>();
    for (const r of data ?? []) {
      const existing = latest.get(r.metric_id);
      if (existing) {
        existing.total30 += 1;
        if (r.status === "ok") existing.ok30 += 1;
      } else {
        latest.set(r.metric_id, {
          metricId: r.metric_id,
          title: r.title,
          category: r.category,
          source: r.source,
          sourceUrl: r.source_url,
          status: r.status,
          note: r.note,
          lastChecked: r.checked_at,
          ok30: r.status === "ok" ? 1 : 0,
          total30: 1,
        });
      }
    }

    const rows = [...latest.values()].sort((a, b) =>
      a.category === b.category ? a.title.localeCompare(b.title) : a.category.localeCompare(b.category),
    );
    return { rows, checksSince: since, fetchedAt: new Date().toISOString() };
  },
);
