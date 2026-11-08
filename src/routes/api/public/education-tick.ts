import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

const STAGES = ["schools", "providers", "headlines"] as const;

/** Nightly refresh of one education stage: school register + Ofsted + KS4, OfS register, or DfE national headlines. */
export const Route = createFileRoute("/api/public/education-tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const body = (await request.json().catch(() => ({}))) as { stage?: string };
        const stage = STAGES.find((s) => s === body.stage);
        if (!stage) return Response.json({ ok: false, error: "unknown stage" }, { status: 400 });
        const { refreshEducation } = await import("@/lib/education.server");
        const s = await refreshEducation(stage);
        return Response.json({ ok: s.errors.length === 0, stage, errors: s.errors });
      },
    },
  },
});
