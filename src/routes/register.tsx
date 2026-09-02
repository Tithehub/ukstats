import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getUkStats } from "@/lib/uk-stats.functions";
import { CATEGORIES, freshnessOf, fmtDate, type StatsPayload } from "@/lib/uk-stats";
import { MetricCard } from "@/components/MetricCard";
import { ThreatBoard, isStatusMetric } from "@/components/ThreatBoard";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";


const statsQuery = queryOptions<StatsPayload>({
  queryKey: ["uk-stats"],
  queryFn: () => getUkStats(),
  staleTime: 5 * 60_000,
});

export const Route = createFileRoute("/register")({
  loader: ({ context }) => context.queryClient.ensureQueryData(statsQuery),
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
  const [filter, setFilter] = useState<string>("All");
  const origin = typeof window === "undefined" ? "" : window.location.origin;

  const debt = data.metrics.find((m) => m.id === "uk-national-debt");
  const statusMetrics = useMemo(
    () => data.metrics.filter((m) => isStatusMetric(m) && (filter === "All" || m.category === filter)),
    [data.metrics, filter],
  );
  const shown = useMemo(
    () => data.metrics.filter((m) => !isStatusMetric(m) && (filter === "All" || m.category === filter)),
    [data.metrics, filter],
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
            <div className="ml-auto text-right leading-tight">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">
                Source · ONS PUSF (HF6W)
              </p>
              <p className="font-mono text-[11px] text-night-muted">
                {debt?.period ?? "—"} · published {fmtDate(debt?.asOf ?? null)} · next {fmtDate(debt?.nextDue ?? null)}
              </p>
            </div>
          </div>

          <nav aria-label="Categories" className="-mx-1 flex gap-1 overflow-x-auto pb-3">
            {["All", ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                aria-pressed={filter === c}
                className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric ${
                  filter === c
                    ? "bg-electric text-night"
                    : "text-night-muted hover:bg-night-panel hover:text-night-fg"
                }`}
              >
                {c}
              </button>
            ))}
          </nav>
        </div>
      </div>


      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        <h1 className="sr-only">UK National Data Register — live official statistics</h1>

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown
            .filter((m) => m.category !== "Irregular immigration & cost" && m.category !== "Crime")
            .slice()
            .sort((a, b) => {
              const order = { fresh: 0, ageing: 1, overdue: 2, unknown: 3 } as const;
              return order[freshnessOf(a)] - order[freshnessOf(b)];
            })
            .map((m) => (
              <MetricCard key={m.id} metric={m} origin={origin} />
            ))}
        </div>

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
                  Values are pulled at request time from the issuing bodies — ONS, Home Office, HM Land Registry,
                  Police.uk and Open-Meteo — and never modelled, interpolated or rounded by this service.
                </p>
              </div>
              <div>
                <p className="font-medium text-night-fg">Age is always stated</p>
                <p className="mt-1 text-pretty">
                  Each card carries an explicit "as of" date and the publisher's next scheduled release. Where a body
                  publishes only spreadsheets, the card shows no number at all — it tracks the publication instead.
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
      </main>

      <SiteFooter fetchedAt={data.fetchedAt} />

    </div>
  );
}
