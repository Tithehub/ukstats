import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Check, Loader2, Play, X, ExternalLink, AlertTriangle, Info, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { useAuth } from "@/lib/useAuth";
import { dismissFinding, getAgentDashboard, reviewDraft, runAgentsNow } from "@/lib/agents.functions";
import { LaunchKit, MarketingPanel } from "@/components/agents/MarketingPanel";
import { DomainsPanel } from "@/components/agents/DomainsPanel";
import { SponsorsPanel } from "@/components/agents/SponsorsPanel";
import { ImprovementPlanPanel } from "@/components/agents/ImprovementPlanPanel";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Overnight agent team — UKStats" },
      { name: "description", content: "Private morning briefing from the UKStats overnight checking agents." },
      { property: "og:title", content: "Overnight agent team — UKStats" },
      { property: "og:description", content: "Private morning briefing from the UKStats overnight checking agents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AgentsPage,
});

const sevIcon = (s: string) =>
  s === "critical" ? <XCircle className="h-4 w-4 text-overdue" aria-hidden /> : s === "warning" ? <AlertTriangle className="h-4 w-4 text-ageing" aria-hidden /> : <Info className="h-4 w-4 text-electric" aria-hidden />;

function AgentsPage() {
  const { signedIn, loading } = useAuth();
  const qc = useQueryClient();
  const fetchDash = useServerFn(getAgentDashboard);
  const run = useServerFn(runAgentsNow);
  const review = useServerFn(reviewDraft);
  const dismiss = useServerFn(dismissFinding);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["agents"], queryFn: () => fetchDash(), enabled: signedIn });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["agents"] }); qc.invalidateQueries({ queryKey: ["improvement-plan"] }); };

  let body: React.ReactNode;
  if (loading || (signedIn && q.isLoading)) body = <Loader2 className="h-5 w-5 animate-spin" aria-label="Loading" />;
  else if (!signedIn) body = <p>Please <Link to="/auth" className="text-electric-soft underline">sign in</Link> as an admin to see the briefing.</p>;
  else if (!q.data?.isAdmin) body = <p className="text-night-muted">This page is for site admins only.</p>;
  else {
    const { runs, findings, drafts } = q.data;
    const latest = runs[0];
    const open = findings.filter((f) => f.status === "open");
    body = (
      <>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true); setErr(null);
              try { await run(); await refresh(); } catch (e) { setErr(e instanceof Error ? e.message : "Run failed"); }
              setBusy(false);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-electric px-4 font-medium text-night disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />} {busy ? "Agents working… (about a minute)" : "Run now"}
          </button>
          {latest ? <span className="font-mono text-[12px] text-night-muted">Last run {new Date(latest.started_at).toLocaleString("en-GB")} · {latest.status}</span> : null}
        </div>
        {err ? <p className="mt-3 text-overdue">{err}</p> : null}
        <ImprovementPlanPanel />
        {latest?.pause_reason ? <p className="mt-3 text-ageing">AI agents paused: {latest.pause_reason}</p> : null}

        <section className="mt-8 rounded-xl border border-night-line bg-night-panel p-5">
          <h2 className="font-mono text-[12px] uppercase tracking-[0.14em] text-night-muted">Morning briefing</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed">{latest?.briefing ?? "No runs yet — press Run now, or wait for tonight's 02:00 run."}</p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Findings ({open.length})</h2>
          <ul className="mt-3 divide-y divide-night-line rounded-xl border border-night-line">
            {open.map((f) => (
              <li key={f.id} className="flex items-start gap-3 px-4 py-3">
                {sevIcon(f.severity)}
                <div className="min-w-0 flex-1">
                  <p className="text-[14px]"><span className="font-mono text-[11px] uppercase text-night-muted">{f.agent}</span> · {f.title}</p>
                  {f.detail ? <p className="mt-0.5 text-[13px] text-night-muted break-words">{f.detail}</p> : null}
                  {f.url ? <a href={f.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[12px] text-electric-soft underline">Open <ExternalLink className="h-3 w-3" aria-hidden /></a> : null}
                </div>
                <button type="button" aria-label="Dismiss" onClick={async () => { await dismiss({ data: { id: f.id } }); refresh(); }} className="grid h-11 w-11 place-items-center rounded-lg hover:bg-night-line">
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
            {!open.length ? <li className="px-4 py-3 text-night-muted">Nothing open.</li> : null}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">Explainer drafts awaiting approval ({drafts.length})</h2>
          <div className="mt-3 space-y-4">
            {drafts.map((d) => (
              <article key={d.id} className="rounded-xl border border-night-line bg-night-panel p-5">
                <p className="font-mono text-[11px] uppercase text-night-muted">{d.metric_id}</p>
                <h3 className="mt-1 font-semibold">{d.title}</h3>
                <p className="mt-2 text-night-muted">{d.summary}</p>
                {(d.sections as { heading: string; body: string }[]).map((s) => (
                  <div key={s.heading} className="mt-3"><p className="font-medium">{s.heading}</p><p className="text-[14px] text-night-muted">{s.body}</p></div>
                ))}
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={async () => { await review({ data: { id: d.id, approve: true } }); refresh(); }} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-fresh/20 px-4 text-fresh"><Check className="h-4 w-4" aria-hidden /> Approve & publish</button>
                  <button type="button" onClick={async () => { await review({ data: { id: d.id, approve: false } }); refresh(); }} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-night-line px-4"><X className="h-4 w-4" aria-hidden /> Reject</button>
                </div>
              </article>
            ))}
            {!drafts.length ? <p className="text-night-muted">No drafts waiting.</p> : null}
          </div>
        </section>
        <MarketingPanel />
        <LaunchKit />
        <DomainsPanel />
        <SponsorsPanel />
      </>
    );
  }

  return (
    <div className="min-h-dvh bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
        <p className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.18em] text-night-muted"><Bot className="h-4 w-4 text-electric" aria-hidden /> Overnight agent team</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your morning briefing</h1>
        <p className="mt-2 text-night-muted">Six agents check every feed, spot publisher revisions, audit figures, inspect the live site and draft explainers each night. They never change a figure — you approve every draft.</p>
        <div className="mt-8">{body}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
