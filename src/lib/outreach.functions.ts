import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getUkStats } from "@/lib/uk-stats.functions";
import { VITAL_IDS } from "@/components/VitalSigns";
import { draftDigest, draftForMetric, type Draft, type DraftInput } from "@/lib/outreach";

export interface ChangeRow {
  id: string;
  metric_id: string;
  title: string;
  category: string;
  value: string | null;
  previous_value: string | null;
  period: string | null;
  as_of: string | null;
  source: string;
  source_url: string;
  detected_at: string;
}

export interface OutreachQueue {
  drafts: Draft[];
  changes: ChangeRow[];
  fetchedAt: string;
  /** True once the change log has been populated by at least one scheduled run. */
  tracking: boolean;
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

const dateLabel = () =>
  new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });

/**
 * Build the draft queue: one post per recently changed official figure, plus a
 * digest of the pinned vital signs. Reads only public data.
 */
export const getOutreachQueue = createServerFn({ method: "POST" }).handler(async (): Promise<OutreachQueue> => {
  const stats = await getUkStats();
  const byId = new Map(stats.metrics.map((m) => [m.id, m]));

  let changes: ChangeRow[] = [];
  try {
    const { data } = await publicClient().rpc("list_recent_changes", { max_rows: 40 });
    changes = (data ?? []) as ChangeRow[];
  } catch {
    /* the change log is an enhancement — drafts still build from live figures */
  }

  const toInput = (c: ChangeRow): DraftInput | null => {
    const m = byId.get(c.metric_id);
    if (!c.value) return null;
    return {
      metricId: c.metric_id,
      title: c.title,
      category: c.category,
      value: c.value,
      period: c.period,
      changeLabel: m?.change?.label ?? null,
      previousValue: c.previous_value,
      source: c.source,
      sourceUrl: c.source_url,
      hasHistory: Boolean(m?.hasHistory),
    };
  };

  const seen = new Set<string>();
  const drafts: Draft[] = [];
  for (const c of changes) {
    if (seen.has(c.metric_id)) continue;
    const input = toInput(c);
    if (!input) continue;
    seen.add(c.metric_id);
    drafts.push(draftForMetric(input));
  }

  // Before the change log has any history, seed the queue with the freshest
  // published figures so the page is useful from the first visit.
  if (!drafts.length) {
    const fresh = stats.metrics
      .filter((m) => m.status === "ok" && m.value && m.asOf)
      .sort((a, b) => (b.asOf ?? "").localeCompare(a.asOf ?? ""))
      .slice(0, 12);
    for (const m of fresh) {
      drafts.push(
        draftForMetric({
          metricId: m.id,
          title: m.title,
          category: m.category,
          value: m.value!,
          period: m.period,
          changeLabel: m.change?.label ?? null,
          previousValue: null,
          source: m.source,
          sourceUrl: m.sourceUrl,
          hasHistory: Boolean(m.hasHistory),
        }),
      );
    }
  }

  const vitals = VITAL_IDS.map((id) => byId.get(id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m?.value))
    .map((m) => ({
      metricId: m.id,
      title: m.title,
      category: m.category,
      value: m.value!,
      period: m.period,
      changeLabel: m.change?.label ?? null,
      previousValue: null,
      source: m.source,
      sourceUrl: m.sourceUrl,
      hasHistory: Boolean(m.hasHistory),
    }));

  const digest = draftDigest(vitals, dateLabel());

  return {
    drafts: digest ? [digest, ...drafts] : drafts,
    changes,
    fetchedAt: stats.fetchedAt,
    tracking: changes.length > 0,
  };
});
