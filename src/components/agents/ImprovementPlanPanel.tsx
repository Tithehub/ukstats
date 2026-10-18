import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ClipboardCopy, X } from "lucide-react";
import { getLatestPlan, setPlanTaskStatus } from "@/lib/agents.functions";
import { buildRequest } from "@/lib/agents/planner";
import { fmtDate } from "@/lib/uk-stats";

export function ImprovementPlanPanel() {
  const qc = useQueryClient();
  const fetchPlan = useServerFn(getLatestPlan);
  const setStatus = useServerFn(setPlanTaskStatus);
  const q = useQuery({ queryKey: ["improvement-plan"], queryFn: () => fetchPlan() });
  const [copied, setCopied] = useState(false);
  const plan = q.data;
  const update = async (index: number, status: "approved" | "skipped" | "pending") => {
    if (!plan) return;
    await setStatus({ data: { id: plan.id, index, status } });
    qc.invalidateQueries({ queryKey: ["improvement-plan"] });
  };
  const request = plan ? buildRequest(plan.tasks) : "";

  return (
    <section className="mt-8 rounded-xl border border-electric/40 bg-night-panel p-5">
      <h2 className="text-xl font-semibold">This morning's improvement plan</h2>
      {!plan ? (
        <p className="mt-2 text-night-muted">{q.isLoading ? "Loading…" : "No plan yet — it's written at the end of each nightly run."}</p>
      ) : (
        <>
          <p className="mt-1 font-mono text-[12px] text-night-muted">Written {fmtDate(plan.created_at)} · nothing has been changed on the site</p>
          <p className="mt-3 leading-relaxed">{plan.summary}</p>
          <ol className="mt-4 space-y-3">
            {plan.tasks.map((t, i) => (
              <li key={i} className={`rounded-lg border border-night-line p-4 ${t.status === "skipped" ? "opacity-50" : ""}`}>
                <p className="font-medium">{i + 1}. {t.title} <span className="ml-2 font-mono text-[11px] uppercase text-night-muted">{t.size}</span>{t.needs_user ? <span className="ml-2 font-mono text-[11px] uppercase text-ageing">Needs you</span> : null}</p>
                <p className="mt-1 text-[14px]">{t.why}</p>
                <p className="mt-1 text-[13px] text-night-muted">Evidence: {t.evidence}</p>
                <p className="mt-1 text-[13px] text-night-muted">Done when: {t.success_check}</p>
                {t.needs_user ? <p className="mt-1 text-[13px] text-ageing">Needs from you: {t.needs_user}</p> : null}
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => update(i, t.status === "approved" ? "pending" : "approved")} className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-4 ${t.status === "approved" ? "bg-fresh text-night" : "bg-fresh/20 text-fresh"}`}><Check className="h-4 w-4" aria-hidden /> {t.status === "approved" ? "Approved" : "Approve"}</button>
                  <button type="button" onClick={() => update(i, t.status === "skipped" ? "pending" : "skipped")} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-night-line px-4"><X className="h-4 w-4" aria-hidden /> {t.status === "skipped" ? "Skipped" : "Skip"}</button>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => update(-1, "approved")} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-fresh/20 px-4 text-fresh"><Check className="h-4 w-4" aria-hidden /> Approve all</button>
            <button
              type="button"
              disabled={!request}
              onClick={async () => { await navigator.clipboard.writeText(request); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-electric px-4 font-medium text-night disabled:opacity-50"
            >
              <ClipboardCopy className="h-4 w-4" aria-hidden /> {copied ? "Copied — paste it to Lovable" : "Copy build request"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
