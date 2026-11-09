import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import type { Source } from "@/lib/racing/racing.functions";
import gallops from "@/assets/racing/gallops.jpg";

export function ExampleBadge() {
  return <span className="ml-2 inline-block rounded bg-racing-gold px-1.5 py-0.5 align-middle font-mono text-[10px] font-bold uppercase tracking-wider text-night">Example</span>;
}

/** Jockey-silk colour stripe, picked from the horse id so it stays the same everywhere. */
export function Silk({ id }: { id: string }) {
  const n = [...id].reduce((h, c) => h + c.charCodeAt(0), 0);
  const a = `var(--silk-${(n % 5) + 1})`, b = `var(--silk-${((n >> 2) % 5) + 1})`;
  return <span aria-hidden className="mr-2 inline-block h-4 w-3 rounded-sm border border-night-line align-middle" style={{ background: `linear-gradient(135deg, ${a} 50%, ${b} 50%)` }} />;
}

const TABS = [
  { to: "/racing", label: "Dashboard" },
  { to: "/racing/horses", label: "Horse database" },
  { to: "/racing/people", label: "Trainers & jockeys" },
  { to: "/racing/results", label: "Results" },
  { to: "/racing/competitions", label: "Competitions" },
] as const;

export function RacingLayout({ title, intro, image, demo = false, children }: { title: string; intro?: ReactNode; image?: string; demo?: boolean; children: ReactNode }) {
  return <div className="racing min-h-screen bg-night text-night-fg">
    <SiteHeader />
    <div className="relative h-40 overflow-hidden sm:h-56">
      <img src={image ?? gallops} alt="" width={1600} height={640} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/40 to-transparent" />
    </div>
    <div className="racing-rail h-1.5" aria-hidden />
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-racing-gold">UKStats · Horse racing</p>
      <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{title}</h1>
      {intro && <div className="mt-3 max-w-3xl text-sm text-night-muted">{intro}</div>}
      {!demo && <p className="mt-2 text-xs text-night-muted">Racecards supplied by <a href="https://www.theracingapi.com/" target="_blank" rel="noreferrer" className="underline">The Racing API</a>.</p>}
      {demo && <div role="note" className="mt-4 rounded-lg border-2 border-racing-gold bg-night-panel p-3 text-sm">
        <strong className="text-racing-gold">EXAMPLE — not real racing data.</strong> Horses, trainers, jockeys, form and placings here are invented to show how the section works. Racecourses are real. No odds are shown. Real racecards replace these once a licensed data feed is connected.
      </div>}
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

export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: string | undefined }) {
  return <div className="rounded-lg border border-night-line bg-night-panel p-4">
    <div className="font-mono text-[11px] uppercase tracking-widest text-night-muted">{label}</div>
    <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
    {note && <div className="mt-1 text-xs text-night-muted">{note}</div>}
  </div>;
}
