import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/** Nightly refresh of the happiest/saddest countries snapshot. */
export const Route = createFileRoute("/api/public/world-wellbeing-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { refreshWorldWellbeing } = await import("@/lib/world-wellbeing.server");
        const p = await refreshWorldWellbeing();
        return Response.json({ ok: p.errors.length === 0, official: p.official?.rows.length ?? 0, errors: p.errors });
      },
    },
  },
});
