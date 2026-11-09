import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import type { Source } from "@/lib/racing/racing.functions";

const TABS = [
  { to: "/racing", label: "Dashboard" },
  { to: "/racing/horses", label: "Horse database" },
  { to: "/racing/people", label: "Trainers & jockeys" },
  { to: "/racing/results", label: "Results" },
  { to: "/racing/competitions", label: "Competitions" },
] as const;

export function RacingLayout({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return <div className="min-h-screen bg-night text-night-fg">
    <SiteHeader />
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-racing-gold">UKStats · Horse racing</p>
      <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{title}</h1>
      {intro && <div className="mt-3 max-w-3xl text-sm text-night-muted">{intro}</div>}
      <nav aria-label="Horse racing sections" className="mt-5 flex gap-1 overflow-x-auto border-b border-night-line pb-px">
        {TABS.map((t) => <Link key={t.to} to={t.to} search={{}} activeOptions={{ exact: t.to === "/racing", includeSearch: false }}
          className="inline-flex min-h-11 shrink-0 items-center border-b-2 border-transparent px-3 text-sm text-night-muted hover:text-night-fg"
          activeProps={{ className: "!border-racing-gold !text-night-fg font-semibold" }}>{t.label}</Link>)}
      </nav>
      <div className="mt-6">{children}</div>
      <ResponsibleNotice />
    </main>
    <SiteFooter />
  </div>;
}

export function ResponsibleNotice() {
  return <aside className="mt-10 rounded-lg border border-night-line bg-night-panel p-4 text-sm text-night-muted">
    <p><strong className="text-night-fg">18+ only. Free entertainment and statistics, not betting.</strong> UKStats takes no bets, holds no money and has no links to bookmakers. Predictions are never guaranteed.</p>
    <p className="mt-2">If gambling is affecting you or someone close to you, free confidential help is available from <a className="text-electric-soft underline" href="https://www.begambleaware.org/" target="_blank" rel="noreferrer">GambleAware</a> and the <a className="text-electric-soft underline" href="https://www.gamcare.org.uk/" target="_blank" rel="noreferrer">GamCare</a> National Gambling Helpline on 0808 8020 133.</p>
  </aside>;
}

/** Shown wherever a licensed racing feed is required but none is connected — never placeholder racing data. */
export function NoFeed({ sources, what }: { sources: Source[]; what: string }) {
  const live = sources.filter((s) => s.status === "connected");
  return <div className="rounded-lg border-2 border-dashed border-night-line bg-night-panel p-6">
    <p className="font-mono text-xs font-bold uppercase tracking-widest text-racing-gold">{live.length ? "No records yet" : "No live feed"}</p>
    <p className="mt-2 text-lg font-semibold">{live.length ? `No ${what} imported for this period.` : "Data provider not connected"}</p>
    <p className="mt-2 max-w-2xl text-sm text-night-muted">
      {live.length ? "The provider is connected but has sent no records for these dates yet." : <>UK racecards, results and bookmaker odds are only available under a commercial licence (for example from the British Horseracing Authority, Weatherbys or a licensed racing data API). Until one is connected, UKStats shows no {what} at all rather than invented ones.</>}
    </p>
  </div>;
}

export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return <div className="rounded-lg border border-night-line bg-night-panel p-4">
    <div className="font-mono text-[11px] uppercase tracking-widest text-night-muted">{label}</div>
    <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    {note && <div className="mt-1 text-xs text-night-muted">{note}</div>}
  </div>;
}
