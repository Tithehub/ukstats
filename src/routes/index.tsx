import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";
import { useMemo } from "react";
import { getUkStats } from "@/lib/uk-stats.functions";
import { CATEGORIES, fmtDate, type Category, type Metric, type StatsPayload } from "@/lib/uk-stats";
import { VitalSigns } from "@/components/VitalSigns";
import { ShareRow } from "@/components/ShareRow";
import { AlertDial, CategoryPanel, IndicatorCard } from "@/components/home/NightPieces";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SponsorBanner } from "@/components/sponsor/SponsorBanner";
import { getSponsorBannerBoard } from "@/lib/banner.functions";
import { readPaymentsEnvironment } from "@/lib/payments-env";
import type { SponsorBannerRow } from "@/lib/sponsor-visibility";
import { Button } from '@/components/ui/button';
import { Search, ArrowRight, Globe2, ShieldCheck } from 'lucide-react';
import { PageLoadError, PageNotFound } from '@/components/layout/PageFeedback';
import heroNetwork from "@/assets/hero-network.jpg";
import { SLOGAN } from "@/lib/brand";
import { currentBrand } from "@/lib/brand-host";
import { GlobalHome } from "@/components/home/GlobalHome";

const GT = "Stats Solutions — official statistics from around the world";
const GD = "Live official figures for over 30 countries from Eurostat and national publishers, each with its source, data age and next release. Nothing estimated.";
const GLOBAL_HEAD = {
  meta: [
    { title: GT },
    { name: "description", content: GD },
    { property: "og:title", content: GT },
    { property: "og:description", content: GD },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Stats Solutions" },
    { property: "og:url", content: "https://stats.solutions/" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
  links: [{ rel: "canonical", href: "https://stats.solutions/" }],
};

const statsQuery = queryOptions<StatsPayload>({
  queryKey: ["uk-stats"],
  queryFn: () => getUkStats(),
  staleTime: 5 * 60_000,
});

// Asked for while the page is being written out, so a sponsor's banner is part
// of the page itself — even if the browser's interactive layer never starts.
const sponsorBoardQuery = queryOptions<SponsorBannerRow[]>({
  queryKey: ["sponsor-banner-board"],
  queryFn: async () => {
    try {
      return (await getSponsorBannerBoard({ data: { environment: readPaymentsEnvironment() ?? "sandbox" } })).sponsors;
    } catch {
      return []; // a failed lookup must never take the page down — the labelled example shows instead
    }
  },
  staleTime: 60_000,
});

export const Route = createFileRoute("/")({
  // Return the data itself: the loader's return travels with the page, so the
  // browser never has to ask for it again just to become interactive.
  loader: async ({ context }) => {
    const [stats, sponsors] = await Promise.all([
      context.queryClient.ensureQueryData(statsQuery),
      context.queryClient.ensureQueryData(sponsorBoardQuery),
    ]);
    return { stats, sponsors };
  },
  head: () => (currentBrand() === "global" ? GLOBAL_HEAD : {
    meta: [
      { title: "UKStats — Built by the people, for the people" },
      {
        name: "description",
        content: `${SLOGAN}. Live UK official statistics at a glance: debt, inflation, crime, immigration, house prices and national alert levels — each with its source, data age and next release date.`,
      },
      { property: "og:title", content: "UKStats — Built by the people, for the people" },
      {
        property: "og:description",
        content: `${SLOGAN}. Every figure timestamped, sourced and embeddable. Nothing estimated.`,
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/" },
      { property: "og:image", content: "https://ukstats.co.uk/og/home.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://ukstats.co.uk/og/home.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/" }, { rel: "preload", as: "image", href: heroNetwork, fetchPriority: "high" }],
  }),
  errorComponent: PageLoadError,
  notFoundComponent: PageNotFound,
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
  return currentBrand() === "global" ? <GlobalHome /> : <UkHome />;
}

function UkHome() {
  const { stats: data, sponsors } = Route.useLoaderData();
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


      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6">
        {/* Hero */}
        <section className="relative mt-5 overflow-hidden border-b border-night-line/50">
          <img
            src={heroNetwork}
            alt=""
            fetchPriority="high"
            width={1408}
            height={1024}
            className="absolute inset-y-0 right-0 h-full w-full object-cover opacity-70 sm:w-[62%]"
          />
          <div className="absolute inset-0 bg-linear-to-r from-night via-night/90 to-night/20" />
          <div className="relative grid gap-5 px-2 py-8 sm:px-6 sm:py-10 lg:max-w-[65%]">
            <div>
              <p className="mb-3 font-mono text-xs text-electric-soft">Official statistics · UK & worldwide</p>
              <h1 className="text-4xl font-semibold leading-tight text-balance sm:text-5xl">UKStats</h1>
              <p className="mt-3 text-xl text-night-fg">{SLOGAN}</p>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-night-muted">Debt, prices, crime, migration and more — from official publishers. Every figure dated. Nothing guessed.</p>
            <form action="/register" method="get" role="search" className="flex max-w-xl flex-wrap gap-2">
              <label className="sr-only" htmlFor="home-stat-search">Find a UK statistic</label>
              <div className="relative min-w-0 flex-1 basis-48"><Search aria-hidden="true" className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><input id="home-stat-search" name="q" type="search" placeholder="Find debt, inflation, crime…" className="min-h-11 w-full rounded-md border border-input bg-background py-2 pr-3 pl-10 text-foreground" /></div>
              <Button type="submit"><ArrowRight aria-hidden="true" />Find figures</Button>
            </form>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline"><Link to="/register">All UK statistics<ArrowRight /></Link></Button>
              <Button asChild variant="ghost"><Link to="/countries"><Globe2 />Explore countries</Link></Button>
              <Button asChild variant="ghost"><Link to="/safest-places" search={{ country: 'uk' }}><ShieldCheck />Safest places</Link></Button>
            </div>
            {debt ? (
              <p className="font-mono text-[11px] text-night-muted">
                Public sector net debt · <span className="text-night-fg">{debt.value ?? "Unavailable"}</span> ·{" "}
                {debt.period ?? "—"} · published {fmtDate(debt.asOf)}
              </p>
            ) : null}
          </div>
        </section>

        {/* Sponsor banner — sits under the hero for visibility, always labelled, never beside individual figures. */}
        <div className="mt-4">
          <SponsorBanner variant="hero" initialRows={sponsors} />
        </div>

        <div className="mt-6"><VitalSigns metrics={metrics} /></div>
        <nav aria-label="More ways to explore" className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-b border-night-line py-3 text-sm text-electric-soft">
          <Link to="/daily" className="inline-flex min-h-11 items-center">Latest releases →</Link>
          <Link to="/safest-places" search={{ country: 'uk' }} className="inline-flex min-h-11 items-center">Safest places →</Link>
          <Link to="/compare-countries" search={{ metric: 'hicp' }} className="inline-flex min-h-11 items-center">Compare countries →</Link>
          <Link to="/widget" className="inline-flex min-h-11 items-center">Embed a figure →</Link>
        </nav>

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
            {[{ category: "Cost of living" as Category, blurb: "Published prices, household costs and earnings." }, ...PANELS].filter((p) => CATEGORIES.includes(p.category)).map((p) => (
              <CategoryPanel
                key={p.category}
                title={p.category}
                blurb={p.blurb}
                defaultOpen={false}
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
