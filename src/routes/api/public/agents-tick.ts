import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/public/agents-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { runAgentTeam } = await import("@/lib/agents/engine.server");
        const result = await runAgentTeam();
        return Response.json(result);
      },
    },
  },
});
