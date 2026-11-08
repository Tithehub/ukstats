import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/** Nightly refresh of the official school register, Ofsted outcomes, KS4 results and the OfS register. */
export const Route = createFileRoute("/api/public/education-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { refreshEducation } = await import("@/lib/education.server");
        const s = await refreshEducation();
        return Response.json({ ok: true, schools: s.gias?.open ?? null, providers: s.providers?.count ?? null, headlines: s.headlines.length, errors: s.errors });
      },
    },
  },
});
