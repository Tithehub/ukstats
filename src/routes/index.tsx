import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getUkStats } from "@/lib/uk-stats.functions";
import { CATEGORIES, COST_GROUPS, fmtDate, type Category, type Metric, type StatsPayload } from "@/lib/uk-stats";
import { VitalSigns } from "@/components/VitalSigns";
import { ShareRow } from "@/components/ShareRow";
import { AlertDial, CategoryPanel, IndicatorCard } from "@/components/home/NightPieces";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import heroNetwork from "@/assets/hero-network.jpg";

const statsQuery = queryOptions<StatsPayload>({
  queryKey: ["uk-stats"],
  queryFn: () => getUkStats(),
  staleTime: 5 * 60_000,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(statsQuery),
  head: () => ({
    meta: [
      { title: "UKStats — the UK in numbers, live from official sources" },
      {
        name: "description",
        content:
          "Live UK official statistics at a glance: debt, inflation, crime, immigration, house prices and national alert levels — each with its source, data age and next release date.",
      },
      { property: "og:title", content: "UKStats — the UK in numbers, live from official sources" },
      {
        property: "og:description",
        content:
          "Key UK indicators and official alert levels on one calm page, every figure timestamped and embeddable. Nothing estimated.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/" }],
  }),
  component: Home,
});

const KEY_IDS = [
  "uk-national-debt",
  "uk-cpi",
  "uk-unemployment",
  "uk-house-prices",
  "uk-irregular-migration",
  "uk-defence-spend",
];

const PANELS: { category: Category; blurb: string }[] = [
  { category: "Finance", blurb: "Public finances and the wider economy, as published by the ONS." },
  {
    category: "Crime",
    blurb: "Police recorded crime for England and Wales, with the published rates per head of population.",
  },
  {
    category: "Population & migration",
    blurb:
      "Resident population and long-term international migration, including British nationals leaving and returning.",
  },
  { category: "Immigration", blurb: "Lawful migration routes and visa grants published by the Home Office." },
  {
    category: "Irregular immigration & cost",
    blurb: "Detected irregular arrivals and the published asylum support outturn behind the cost figures.",
  },
  {
    category: "NHS & doctors",
    blurb:
      "NHS workforce, waiting lists and emergency care. Scottish figures come from Public Health Scotland's open data; NHS England and the GMC block automated access, so those cards carry the official release instead of a number.",
  },
  {
    category: "Politics & polling",
    blurb:
      "The Electoral Commission's live party register and Westminster voting intention taken from pollsters' own published releases.",
  },
  { category: "Housing", blurb: "HM Land Registry house price data as published." },

  { category: "Weather", blurb: "Observed conditions and environmental readings." },
  { category: "Defence & security", blurb: "Defence spending and security indicators from official releases." },
];

function Home() {
  const { data } = useSuspenseQuery(statsQuery);
  const metrics = data.metrics;
  const live = metrics.filter((m) => m.status === "ok").length;

  const byId = useMemo(() => new Map(metrics.map((m) => [m.id, m])), [metrics]);
  const keyMetrics = KEY_IDS.map((id) => byId.get(id)).filter(Boolean) as Metric[];
  const dials = metrics.filter((m) => m.scale);
  const debt = byId.get("uk-national-debt");

  return (
    <div className="min-h-screen bg-night font-sans text-night-fg">
      <SiteHeader
        status={
          <>
            <span className="size-1.5 rounded-full bg-fresh pulse-dot" />
            {live} of {metrics.length} feeds live
          </>
        }
      />


      <main className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6">
        {/* Vital signs */}
        <div className="pt-4 pb-4">
          <VitalSigns metrics={metrics} />
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-night-line/50">
          <img
            src={heroNetwork}
            alt=""
            width={1408}
            height={1024}
            className="absolute inset-y-0 right-0 h-full w-full object-cover opacity-70 sm:w-[62%]"
          />
          <div className="absolute inset-0 bg-linear-to-r from-night via-night/90 to-night/20" />
          <div className="relative grid gap-6 px-6 py-14 sm:px-10 sm:py-20 lg:max-w-[58%]">
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl">
              The UK in numbers,
              <br />
              <span className="text-electric">live from the source</span>
            </h1>
            <p className="max-w-xl text-[15px] leading-relaxed text-night-muted text-pretty">
              Official statistics from the ONS, Home Office, Police.uk, HM Land Registry, MOD and the Met Office —
              gathered at request time, never estimated, every figure carrying its age and next release date.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-md bg-electric px-4 py-2.5 text-[13px] font-medium text-night transition-opacity hover:opacity-90"
              >
                Explore the full register →
              </Link>
              <Link
                to="/widget"
                className="inline-flex items-center gap-2 rounded-md border border-night-line px-4 py-2.5 text-[13px] font-medium text-night-fg transition-colors hover:border-electric"
              >
                Build an embeddable widget
              </Link>
            </div>
            {debt ? (
              <p className="font-mono text-[11px] text-night-muted">
                Public sector net debt · <span className="text-night-fg">{debt.value ?? "Unavailable"}</span> ·{" "}
                {debt.period ?? "—"} · published {fmtDate(debt.asOf)}
              </p>
            ) : null}
          </div>
        </section>

        {/* Capability strip */}
        <section className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-night-line/50 bg-night-line/50 sm:grid-cols-3">
          {[
            {
              title: "Live dashboards",
              body: "One page pulling every connected official feed, refreshed on request.",
            },
            {
              title: "Embeddable widgets",
              body: "Drop any figure or the alert board into your own site with one iframe.",
            },
            {
              title: "Shareable live pages",
              body: "Publish a timed snapshot link that keeps updating while it is live.",
            },
          ].map((c) => (
            <div key={c.title} className="bg-night-panel/60 p-5">
              <h2 className="text-sm font-semibold text-night-fg">{c.title}</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-night-muted text-pretty">{c.body}</p>
            </div>
          ))}
        </section>

        {/* Key indicators */}
        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Key indicators at a glance</h2>
            <Link to="/register" className="font-mono text-[11px] text-electric hover:underline">
              View all data →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {keyMetrics.map((m) => (
              <IndicatorCard key={m.id} metric={m} />
            ))}
          </div>
        </section>

        {/* Official alert levels */}
        {dials.length ? (
          <section className="mt-10">
            <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-lg font-semibold tracking-tight">National alert levels</h2>
              <p className="font-mono text-[11px] text-night-muted">
                Each shown on the issuing body's own published scale — no composite score.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dials.map((m) => (
                <AlertDial key={m.id} metric={m} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Cost of living */}
        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Cost of living, by category</h2>
            <p className="font-mono text-[11px] text-night-muted">
              ONS consumer price series, each with its full published history back to the first release.
            </p>
          </div>
          <div className="space-y-3">
            {COST_GROUPS.map((g, i) => (
              <CategoryPanel
                key={g.name}
                title={g.name}
                blurb={g.blurb}
                defaultOpen={i === 0}
                metrics={metrics.filter((m) => m.category === "Cost of living" && m.subcategory === g.name)}
              />
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Browse by category</h2>
          <div className="space-y-3">
            {PANELS.filter((p) => CATEGORIES.includes(p.category)).map((p, i) => (
              <CategoryPanel
                key={p.category}
                title={p.category}
                blurb={p.blurb}
                defaultOpen={i === 0}
                metrics={metrics.filter((m) => m.category === p.category && !m.scale)}
              />
            ))}
          </div>
        </section>
        <ShareRow
          className="mt-10"
          path="/"
          title="UKStats — live UK official statistics, every figure sourced and timestamped"
        />
      </main>

      <SiteFooter fetchedAt={data.fetchedAt} />

    </div>
  );
}
