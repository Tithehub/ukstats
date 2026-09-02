import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getUkStats } from "@/lib/uk-stats.functions";
import { CATEGORIES, fmtDate, type Category, type Metric, type StatsPayload } from "@/lib/uk-stats";
import { AlertDial, CategoryPanel, IndicatorCard } from "@/components/home/NightPieces";
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
  { category: "Cost of living", blurb: "Consumer price measures on the ONS's own published basis." },
  {
    category: "Crime",
    blurb: "Police recorded crime for England and Wales, with the published rates per head of population.",
  },
  { category: "Immigration", blurb: "Lawful migration routes and visa grants published by the Home Office." },
  {
    category: "Irregular immigration & cost",
    blurb: "Detected irregular arrivals and the published asylum support outturn behind the cost figures.",
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
      <header className="sticky top-0 z-30 border-b border-night-line/60 bg-night/85 backdrop-blur-md">
        <div className="mx-auto grid max-w-[1280px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <span className="flex shrink-0 items-baseline gap-0.5 text-lg font-semibold tracking-tight">
              <span className="mr-1.5 inline-flex items-end gap-[2px]" aria-hidden="true">
                <span className="block h-2.5 w-1 rounded-[1px] bg-electric" />
                <span className="block h-4 w-1 rounded-[1px] bg-electric" />
                <span className="block h-3 w-1 rounded-[1px] bg-electric-soft" />
              </span>
              UK<span className="text-electric">Stats</span>
            </span>
            <nav className="hidden items-center gap-5 font-mono text-[12px] text-night-muted md:flex">
              <span className="text-night-fg">Home</span>
              <Link to="/register" className="hover:text-electric-soft">
                Data
              </Link>
              <Link to="/widget" className="hover:text-electric-soft">
                Widgets
              </Link>
              <Link to="/create" className="hover:text-electric-soft">
                Reports
              </Link>
              <Link to="/my-pages" className="hover:text-electric-soft">
                My pages
              </Link>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-night-line/70 px-3 py-1.5 font-mono text-[11px] text-night-muted lg:inline-flex">
              <span className="size-1.5 rounded-full bg-fresh pulse-dot" />
              {live} of {metrics.length} feeds live
            </span>
            <Link
              to="/create"
              className="rounded-md bg-electric px-3 py-2 text-[12px] font-medium text-night transition-opacity hover:opacity-90"
            >
              Create live page
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6">
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
      </main>

      <footer className="border-t border-night-line/60 bg-night-panel/40">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <p className="text-base font-semibold">
              UK<span className="text-electric">Stats</span>
            </p>
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-night-muted text-pretty">
              An independent aggregator of official UK statistics. Not a government service. Nothing on this site is
              estimated, modelled or interpolated.
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">Data</p>
            <ul className="mt-3 space-y-2 text-[13px]">
              <li>
                <Link to="/register" className="text-night-muted hover:text-electric-soft">
                  Full register
                </Link>
              </li>
              <li>
                <Link to="/widget" className="text-night-muted hover:text-electric-soft">
                  Widget builder
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">Insights</p>
            <ul className="mt-3 space-y-2 text-[13px]">
              <li>
                <Link to="/create" className="text-night-muted hover:text-electric-soft">
                  Create a live page
                </Link>
              </li>
              <li>
                <Link to="/my-pages" className="text-night-muted hover:text-electric-soft">
                  My pages
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">Sources</p>
            <ul className="mt-3 space-y-2 text-[13px] text-night-muted">
              <li>ONS · Home Office</li>
              <li>Police.uk · HM Land Registry</li>
              <li>MOD · MI5 / JTAC · Met Office</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-night-line/50">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 px-4 py-4 font-mono text-[11px] text-night-muted sm:px-6">
            <span>Every figure sourced · nothing estimated</span>
            <span>Last pull {new Date(data.fetchedAt).toLocaleString("en-GB")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
