import { createFileRoute, Link } from "@tanstack/react-router";
import { RestoreSignupCta } from "@/components/RestoreSignupCta";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getUkStats } from "@/lib/uk-stats.functions";
import { CATEGORIES, COST_GROUPS, freshnessOf, fmtDate, type StatsPayload } from "@/lib/uk-stats";
import { VitalSigns } from "@/components/VitalSigns";
import { ShareRow } from "@/components/ShareRow";
import { MetricCard } from "@/components/MetricCard";
import { ThreatBoard, isStatusMetric } from "@/components/ThreatBoard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { matchesMetric } from '@/lib/stat-search';
import { PageLoadError, PageNotFound } from '@/components/layout/PageFeedback';
import { ANSWER_TOPICS } from '@/lib/answer-topics';
import { UkTopicNav } from '@/components/UkTopicNav';


const statsQuery = queryOptions<StatsPayload>({
  queryKey: ["uk-stats"],
  queryFn: () => getUkStats(),
  staleTime: 5 * 60_000,
});

export const Route = createFileRoute("/register")({
  validateSearch: (s: Record<string, unknown>): { q?: string | undefined; category?: string | undefined } => ({
    q: typeof s['q'] === 'string' ? s['q'] : undefined,
    category: typeof s['category'] === 'string' && CATEGORIES.some(c => c === s['category']) ? s['category'] : undefined,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(statsQuery),
  errorComponent: PageLoadError,
  notFoundComponent: PageNotFound,
  head: () => ({
    meta: [
      { title: "Full UK data register — every official figure, timestamped" },
      {
        name: "description",
        content:
          "The complete register: crime, debt, inflation, immigration, house prices, alerts and weather from ONS, Home Office, Police.uk, HM Land Registry and MOD, each with data age and next release.",
      },
      { property: "og:title", content: "Full UK data register — every official figure" },
      {
        property: "og:description",
        content:
          "Every live UK official statistic this service tracks, with source, reference period, data age and next scheduled release on each figure.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/register" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/register" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useSuspenseQuery(statsQuery);
  const { q = '', category } = Route.useSearch();
  const filter = category ?? 'All';
  const navigate = Route.useNavigate();
  const searched = useMemo(() => data.metrics.filter(m => matchesMetric(m, q)), [data.metrics, q]);
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  const debt = data.metrics.find((m) => m.id === "uk-national-debt");
  const statusMetrics = useMemo(
    () => searched.filter((m) => isStatusMetric(m) && (filter === "All" || m.category === filter)),
    [searched, filter],
  );
  const shown = useMemo(
    () => searched.filter((m) => !isStatusMetric(m) && (filter === "All" || m.category === filter)),
    [searched, filter],
  );
  const live = data.metrics.filter((m) => m.status === "ok").length;

  const irregularGroups = useMemo(() => {
    const irr = shown.filter((m) => m.category === "Irregular immigration & cost");
    const isDemo = (id: string) => id.startsWith("uk-boats-");
    const isNat = (id: string) => id.startsWith("uk-boats-nat-");
    const isCost = (id: string) => id.startsWith("uk-irregular-cost");
    return [
      {
        title: "Arrivals",
        blurb: "Detected arrivals and boats, as published by the Home Office",
        metrics: irr.filter((m) => !isDemo(m.id) && !isCost(m.id)),
      },
      {
        title: "Demographics",
        blurb: "Age group and sex of small boat arrivals, Home Office table IER_02c",
        metrics: irr.filter((m) => isDemo(m.id) && !isNat(m.id)),
      },
      {
        title: "Nationality",
        blurb: "Nationality of small boat arrivals, Home Office table IER_02b",
        metrics: irr.filter((m) => isNat(m.id)),
      },
      {
        title: "Cost",
        blurb: "Published asylum support outturn and rates derived from it",
        metrics: irr.filter((m) => isCost(m.id)),
      },
    ];
  }, [shown]);

  const costGroups = useMemo(() => {
    const col = shown.filter((m) => m.category === "Cost of living");
    return COST_GROUPS.map((g) => ({
      title: g.name,
      blurb: g.blurb,
      metrics: col.filter((m) => m.subcategory === g.name),
    })).concat(
      col.some((m) => !m.subcategory)
        ? [{ title: "Other price measures", blurb: "Further published price series.", metrics: col.filter((m) => !m.subcategory) }]
        : [],
    );
  }, [shown]);

  const crimeGroups = useMemo(() => {
    const cr = shown.filter((m) => m.category === "Crime");
    const isKnife = (id: string) => id === "uk-crime-knife-selected-offences";
    const isPop = (id: string) => id === "uk-crime-population-denominator";
    const isLocal = (id: string) => id === "uk-street-crime";
    const isSexual = (id: string) => id.startsWith("uk-crime-sexual-");
    return [
      {
        title: "Offence groups and rates",
        blurb: "Police recorded crime, England and Wales — counts and the published rate per 1,000 population",
        metrics: cr.filter((m) => !isKnife(m.id) && !isPop(m.id) && !isLocal(m.id) && !isSexual(m.id)),
      },
      {
        title: "Sexual offences",
        blurb:
          "ONS appendix tables A6 and A5a — published counts, the rate per 1,000 population and each recorded offence category",
        metrics: cr.filter((m) => isSexual(m.id)),
      },
      {
        title: "Weapon-enabled crime",
        blurb: "Knife and sharp instrument offences, with the published rate per 100,000 population",
        metrics: cr.filter((m) => isKnife(m.id)),
      },
      {
        title: "Rate basis and local data",
        blurb: "The population denominator behind the rates, plus street-level records",
        metrics: cr.filter((m) => isPop(m.id) || isLocal(m.id)),
      },
    ];
  }, [shown]);



  return (
    <div className="min-h-screen bg-night font-sans text-night-fg selection:bg-electric/25">
      <SiteHeader
        status={
          <>
            <span className="size-1.5 rounded-full bg-fresh pulse-dot" />
            {live} of {data.metrics.length} feeds live
          </>
        }
      />

      <div className="border-b border-night-line/60 bg-night-panel/40">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 pt-6 pb-4">
            <div><h1 className="text-3xl font-semibold">UK statistics</h1><p className="mt-2 text-sm text-night-muted">Official figures, with their sources and publication dates.</p></div>
            <div className="relative w-full sm:max-w-md"><Search aria-hidden="true" className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><Input type="search" aria-label="Search UK statistics" placeholder="Search debt, inflation, crime…" value={q} onChange={e => void navigate({ search: prev => ({ ...prev, q: e.target.value || undefined }), replace: true, resetScroll: false })} className="min-h-11 pl-10" /></div>
          </div>
          <nav aria-label="Official answers" className="flex flex-wrap gap-x-5 gap-y-3 pb-4 text-sm">{ANSWER_TOPICS.map(topic => <Link key={topic.slug} to="/answers/$question" params={{ question: topic.slug }} className="text-electric-soft underline">{topic.title}</Link>)}</nav>
          <UkTopicNav />
          <details className="border-t border-night-line/50">
          <summary className="min-h-11 cursor-pointer py-3 text-sm text-night-muted">Public sector net debt · {debt?.value ?? 'Unavailable'}</summary>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
            <div className="leading-none">
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-night-muted">
                UK public sector net debt · as published
              </p>
              <div className="flex items-end gap-2">
                <span className="roll font-mono text-3xl font-semibold tracking-tighter tabular-nums sm:text-4xl">
                  {debt?.value ?? "Unavailable"}
                </span>
                {debt?.change ? (
                  <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-fresh/10 px-2 py-0.5 font-mono text-[10px] font-medium text-fresh">
                    <span className="size-1.5 rounded-full bg-fresh pulse-dot" />
                    {debt.change.label}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="w-full leading-tight sm:ml-auto sm:w-auto sm:text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">
                Source · ONS PUSF (HF6W)
              </p>
              <p className="font-mono text-[11px] text-night-muted">
                {debt?.period ?? "—"} · published {fmtDate(debt?.asOf ?? null)} · next {fmtDate(debt?.nextDue ?? null)}
              </p>
            </div>
          </div>
          </details>

          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <label className="flex min-w-0 items-center gap-3 text-sm text-night-muted">Category<select aria-label="Statistics category" value={filter} onChange={e => void navigate({ search: prev => ({ ...prev, category: e.target.value === 'All' ? undefined : e.target.value }), replace: true, resetScroll: false })} className="min-h-11 max-w-[230px] rounded-md border border-input bg-background px-3 text-foreground">{['All', ...CATEGORIES].map(c => <option key={c}>{c}</option>)}</select></label>
            <p role="status" className="text-sm text-night-muted">{shown.length + statusMetrics.length} figures</p>
          </div>
        </div>
      </div>


      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        {!shown.length && !statusMetrics.length ? <div className="py-8"><h2 className="text-xl font-semibold">No matching figures</h2><Button variant="outline" className="mt-4" onClick={() => void navigate({ search: {}, replace: true })}>Clear filters</Button></div> : null}

        {statusMetrics.length ? (
          <div className="pb-6">
            <ThreatBoard metrics={statusMetrics} />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pb-5 font-mono text-[11px] text-steel">
          <span className="font-semibold uppercase tracking-[0.14em] text-steel/70">Data age</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-fresh" />Fresh · updated &lt;7d
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-ageing" />Ageing · 7–28d
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-overdue" />Overdue · past due date
          </span>
          <span className="ml-auto hidden text-steel/50 sm:inline">
            Figures are reproduced verbatim from the issuing body; nothing is estimated.
          </span>
        </div>

        <div className={q || category ? 'hidden' : 'pb-6'}>
          <VitalSigns metrics={data.metrics} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown
            .filter(
              (m) =>
                m.category !== "Irregular immigration & cost" &&
                m.category !== "Crime" &&
                m.category !== "Cost of living",
            )
            .slice()
            .sort((a, b) => {
              const order = { fresh: 0, ageing: 1, overdue: 2, unknown: 3 } as const;
              return order[freshnessOf(a)] - order[freshnessOf(b)];
            })
            .map((m) => (
              <MetricCard key={m.id} metric={m} origin={origin} />
            ))}
        </div>

        {costGroups.some((g) => g.metrics.length) ? (
          <section className="mt-10">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-steel/60">Cost of living</h2>
            {costGroups
              .filter((g) => g.metrics.length)
              .map((g) => (
                <div key={g.title} className="mt-5">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h3 className="text-sm font-semibold tracking-tight">{g.title}</h3>
                    <p className="font-mono text-[11px] text-steel/60">{g.blurb}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {g.metrics.map((m) => (
                      <MetricCard key={m.id} metric={m} origin={origin} />
                    ))}
                  </div>
                </div>
              ))}
          </section>
        ) : null}

        {crimeGroups.some((g) => g.metrics.length) ? (
          <section className="mt-10">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-steel/60">Crime</h2>
            {crimeGroups
              .filter((g) => g.metrics.length)
              .map((g) => (
                <div key={g.title} className="mt-5">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h3 className="text-sm font-semibold tracking-tight">{g.title}</h3>
                    <p className="font-mono text-[11px] text-steel/60">{g.blurb}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {g.metrics.map((m, i) => (
                      <MetricCard key={`${m.id}-${i}`} metric={m} origin={origin} />
                    ))}
                  </div>
                </div>
              ))}
          </section>
        ) : null}


        {irregularGroups.some((g) => g.metrics.length) ? (
          <section className="mt-10">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-steel/60">
              Irregular immigration &amp; cost
            </h2>
            {irregularGroups
              .filter((g) => g.metrics.length)
              .map((g) => (
                <div key={g.title} className="mt-5">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h3 className="text-sm font-semibold tracking-tight">{g.title}</h3>
                    <p className="font-mono text-[11px] text-steel/60">{g.blurb}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {g.metrics.map((m, i) => (
                      <MetricCard key={`${m.id}-${i}`} metric={m} origin={origin} />
                    ))}
                  </div>
                </div>
              ))}
          </section>
        ) : null}



        <section className="relative mt-8 overflow-hidden rounded-2xl border border-night-line/60 bg-night-panel/60 p-6">
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric/70 to-transparent" />
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">Data provenance</p>
              <h2 className="mt-2 text-xl font-semibold leading-tight tracking-tight text-balance">
                Every figure is sourced. Nothing is estimated.
              </h2>
            </div>
            <div className="grid gap-4 font-mono text-[12px] text-night-muted sm:grid-cols-2 md:col-span-2">
              <div>
                <p className="font-medium text-night-fg">Direct source feeds</p>
                <p className="mt-1 text-pretty">
                  Official statistics retain their issuing body's source and reference period. Stored snapshots keep the last successfully read figures available during refreshes. Weather-model outputs are not official statistics and must be read separately.
                </p>
              </div>
              <div>
                <p className="font-medium text-night-fg">Age is always stated</p>
                <p className="mt-1 text-pretty">
                  Each card carries an explicit "as of" date and the publisher's next scheduled release when announced. Where a source cannot be read reliably, its publication link remains visible without an invented figure.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-night-line/60 pt-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-night-muted">Issuing bodies</span>
            {["ONS", "Home Office", "HM Land Registry", "Police.uk", "MOD", "MI5 / JTAC", "Open-Meteo"].map((s) => (
              <span
                key={s}
                className="rounded-md border border-night-line/60 px-2 py-1 font-mono text-[11px] text-night-muted"
              >
                {s}
              </span>
            ))}
          </div>
        </section>
        <RestoreSignupCta />
      </main>

      <div className="mx-auto max-w-[1440px] px-4 pb-8 sm:px-6">
        <ShareRow path="/register" title="The full UK data register — every official figure, timestamped" />
      </div>

      <SiteFooter fetchedAt={data.fetchedAt} />

    </div>
  );
}
