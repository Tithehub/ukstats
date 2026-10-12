import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { DailyBriefing, DailyFigure } from "@/lib/daily";

export interface BriefingRow extends DailyBriefing {
  createdAt: string;
}

/** Publishable-key client for public reads. Opaque sb_ keys are not JWTs. */
function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
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
}

type Raw = {
  briefing_date: string;
  headline: string;
  body: string;
  figures: unknown;
  change_count: number;
  created_at: string;
};

function toRow(r: Raw): BriefingRow {
  return {
    date: r.briefing_date,
    headline: r.headline,
    body: r.body,
    figures: Array.isArray(r.figures) ? (r.figures as DailyFigure[]) : [],
    changeCount: r.change_count,
    createdAt: r.created_at,
  };
}

export interface DailyArchive {
  latest: BriefingRow | null;
  entries: BriefingRow[];
  fetchedAt: string;
}

/** Latest statement plus the archive, newest first. Public data only. */
export const getDailyArchive = createServerFn({ method: "POST" }).handler(async (): Promise<DailyArchive> => {
  const { data } = await publicClient().rpc("list_daily_briefings", { max_rows: 400 });

  const entries = ((data ?? []) as Raw[]).map(toRow);
  return { latest: entries[0] ?? null, entries, fetchedAt: new Date().toISOString() };
});

/** One day's statement, or null when nothing was recorded for that date. */
export const getDailyBriefing = createServerFn({ method: "POST" })
  .inputValidator((input: { date: string }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("Invalid date");
    return input;
  })
  .handler(async ({ data }): Promise<{ briefing: BriefingRow | null; prev: string | null; next: string | null }> => {
    const client = publicClient();
    const [{ data: rows }, { data: archive }] = await Promise.all([
      client.rpc("get_daily_briefing", { day: data.date }),
      client.rpc("list_daily_briefings", { max_rows: 400 }),
    ]);

    const row = rows?.[0] ?? null;
    const dates = (archive ?? []).map((r) => r.briefing_date);
    const prev = dates.find((d) => d < data.date) ?? null;
    const next = dates.filter((d) => d > data.date).pop() ?? null;

    return {
      briefing: row ? toRow(row as Raw) : null,
      prev,
      next,
    };
  });
