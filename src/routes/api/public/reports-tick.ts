import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/** Builds today's UK and Global reports (plus weekly/monthly editions when due). */
export const Route = createFileRoute("/api/public/reports-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { generateEdition } = await import("@/lib/reports.server");
        const { kindsFor } = await import("@/lib/reports");
        const { londonDate } = await import("@/lib/daily");
        const date = londonDate();
        const done: string[] = [];
        const failed: string[] = [];
        for (const kind of kindsFor(date))
          for (const edition of ["uk", "global"] as const) {
            try { done.push(await generateEdition(edition, kind, date)); }
            catch (e) { failed.push(`${edition}/${kind}: ${(e as Error).message}`); }
          }
        return Response.json({ date, done, failed });
      },
    },
  },
});
