import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { getUkStats } from "@/lib/uk-stats.functions";

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

        return Response.json({ tracked: snapshots.length, changed: changes.length });
      },
    },
  },
});
