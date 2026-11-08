import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/** Nightly refresh of the places snapshot (well-being, crime, house prices, pay, population, schools). */
export const Route = createFileRoute("/api/public/places-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { refreshPlaces } = await import("@/lib/places.server");
        const p = await refreshPlaces();
        return Response.json({ ok: p.errors.length === 0, places: p.places.length, errors: p.errors });
      },
    },
  },
});
