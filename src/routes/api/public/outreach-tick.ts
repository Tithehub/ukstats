import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { getUkStats } from "@/lib/uk-stats.functions";
import { VITAL_IDS } from "@/components/VitalSigns";
import { composeBriefing, londonDate, type DailyFigure } from "@/lib/daily";


/**
 * Scheduled sweep: compare every published figure against the last snapshot and
 * record genuine changes. Verifies the cron secret before touching anything.
 */
export const Route = createFileRoute("/api/public/outreach-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const stats = await getUkStats();
        const live = stats.metrics.filter((m) => m.status === "ok" && m.value);
        const byId = new Map(stats.metrics.map((m) => [m.id, m]));


        const { data: prior } = await supabaseAdmin.from("metric_snapshots").select("metric_id, value, period");
        const before = new Map((prior ?? []).map((r) => [r.metric_id, r]));

        const changes = [];
        const snapshots = [];
        for (const m of live) {
          const was = before.get(m.id);
          const moved = !was || was.value !== m.value || was.period !== m.period;
          snapshots.push({
            metric_id: m.id,
            title: m.title,
            category: m.category,
            value: m.value,
            period: m.period,
            as_of: m.asOf,
            source: m.source,
            source_url: m.sourceUrl,
            updated_at: new Date().toISOString(),
          });
          // A first sighting is not a change — only record real movement.
          if (moved && was) {
            changes.push({
              metric_id: m.id,
              title: m.title,
              category: m.category,
              value: m.value,
              previous_value: was.value,
              period: m.period,
              as_of: m.asOf,
              source: m.source,
              source_url: m.sourceUrl,
            });
          }
        }

        if (snapshots.length) await supabaseAdmin.from("metric_snapshots").upsert(snapshots, { onConflict: "metric_id" });
        if (changes.length) await supabaseAdmin.from("metric_changes").insert(changes);

        // Write the day's statement. Re-running the sweep on the same day
        // refreshes the row rather than adding a second one, and today's
        // earlier changes are folded back in from the change log.
        const today = londonDate();
        const { data: todaysChanges } = await supabaseAdmin
          .from("metric_changes")
          .select("*")
          .gte("detected_at", `${today}T00:00:00Z`)
          .order("detected_at", { ascending: true });

        const changedFigures: DailyFigure[] = [];
        const seen = new Set<string>();
        for (const c of (todaysChanges ?? []).slice().reverse()) {
          if (!c.value || seen.has(c.metric_id)) continue;
          seen.add(c.metric_id);
          changedFigures.push({
            metricId: c.metric_id,
            title: c.title,
            category: c.category,
            value: c.value,
            previousValue: c.previous_value,
            period: c.period,
            asOf: c.as_of,
            source: c.source,
            sourceUrl: c.source_url,
            role: "changed",
            hasHistory: byId.get(c.metric_id)?.hasHistory ?? false,
          });
        }
        changedFigures.sort((a, b) => a.title.localeCompare(b.title));

        const vitalFigures: DailyFigure[] = VITAL_IDS.map((id) => byId.get(id))
          .filter((m): m is NonNullable<typeof m> => Boolean(m?.value))
          .map((m) => ({
            metricId: m.id,
            title: m.title,
            category: m.category,
            value: m.value!,
            previousValue: null,
            period: m.period,
            asOf: m.asOf,
            source: m.source,
            sourceUrl: m.sourceUrl,
            role: "vital" as const,
            hasHistory: m.hasHistory ?? false,
          }));

        const briefing = composeBriefing(today, [...changedFigures, ...vitalFigures]);
        await supabaseAdmin.from("daily_briefings").upsert(
          {
            briefing_date: briefing.date,
            headline: briefing.headline,
            body: briefing.body,
            figures: briefing.figures as unknown as never,
            change_count: briefing.changeCount,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "briefing_date" },
        );

        return Response.json({ tracked: snapshots.length, changed: changes.length, briefing: briefing.date });

      },
    },
  },
});
