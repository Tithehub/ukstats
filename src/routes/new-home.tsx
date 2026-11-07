import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Search, ArrowRight, ShieldCheck, Ship, CloudFog, Waves, ShoppingCart, Siren, Landmark, Building2, Home, Scale, Backpack, Globe2, Tv, Coins, BarChart3 } from "lucide-react";
import { getUkStats } from "@/lib/uk-stats.functions";
import { ageLabel, dueLabel, freshnessOf, fmtDate, type Category, type Metric, type StatsPayload } from "@/lib/uk-stats";
import { statusTone, type BlockTone } from "@/lib/status-tone";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LiveStreamPanel } from "@/components/LiveStreamPanel";
import { PageLoadError } from "@/components/layout/PageFeedback";
import channel from "@/assets/uk-channel.jpg.asset.json";
import fog from "@/assets/uk-fog.jpg.asset.json";
import westminster from "@/assets/uk-westminster.jpg.asset.json";

const statsQuery = queryOptions<StatsPayload>({ queryKey: ["uk-stats"], queryFn: () => getUkStats(), staleTime: 5 * 60_000 });

export const Route = createFileRoute("/new-home")({
  loader: ({ context }) => context.queryClient.ensureQueryData(statsQuery),
  head: () => ({
    meta: [
      { title: "UKStats — new home page preview" },
      { name: "description", content: "Preview of the redesigned UKStats home page: national debt, small boats, terror threat and weather warnings from official sources." },
      { property: "og:title", content: "UKStats — new home page preview" },
      { property: "og:description", content: "Preview of the redesigned UKStats home page, built from official UK figures." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  errorComponent: PageLoadError,
  component: NewHome,
});

const TONE: Record<BlockTone, string> = {
  red: "bg-alert-red text-desk-fg border-transparent",
  yellow: "bg-alert-yellow text-night border-transparent",
  plain: "bg-card text-card-foreground border-border",
};

function Meta({ m }: { m?: Metric | undefined }) {
  if (!m) return <span>Not published</span>;
  return <span>{m.source} · {m.period ?? fmtDate(m.asOf)} · {ageLabel(m.asOf)}{m.nextDue ? ` · ${dueLabel(m.nextDue)}` : ""}</span>;
}

function Tile({ m, icon, label, link }: { m?: Metric | undefined; icon: ReactNode; label: string; link?: { category: Category } }) {
  const tone = statusTone(m);
  const body = <div className={`flex h-full min-h-32 flex-col justify-between gap-3 rounded-2xl border p-4 shadow-sm transition-transform hover:-translate-y-0.5 ${TONE[tone]}`}>
    <div className="flex items-start justify-between gap-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background/15">{icon}</span>
      {m && <span className="rounded-full bg-background/20 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider">{tone !== "plain" ? "official level" : m.scale ? "current" : freshnessOf(m) === "unknown" ? "" : freshnessOf(m)}</span>}
    </div>
    <div className="min-w-0">
      <div className="font-mono text-2xl font-semibold leading-tight tracking-tight [overflow-wrap:anywhere] sm:text-3xl">{m?.value ?? "Not published"}</div>
      <div className="mt-0.5 text-sm font-bold">{label}</div>
      <div className="mt-1 line-clamp-2 font-mono text-[11px] opacity-80"><Meta m={m} /></div>
    </div>
  </div>;
  return link ? <Link to="/register" search={{ category: link.category, q: undefined }} className="block">{body}</Link> : body;
}

function PhotoTile({ img, icon, title, sub, meta, wide, to }: { img: string; icon: ReactNode; title: string; sub: string; meta: ReactNode; wide?: boolean; to: ReactNode }) {
  return <div className={`relative min-h-56 overflow-hidden rounded-2xl border border-border ${wide ? "sm:col-span-2" : ""}`}>
    <img src={img} alt="" loading="lazy" width={1024} height={768} className="absolute inset-0 size-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
    <div className="relative flex h-full min-h-56 flex-col justify-between p-5 text-foreground">
      <span className="grid size-11 place-items-center rounded-xl bg-background/70 backdrop-blur">{icon}</span>
      <div><div className="font-mono text-3xl font-semibold tracking-tight">{title}</div><div className="text-sm font-bold">{sub}</div><div className="mt-1 font-mono text-[11px] text-muted-foreground">{meta}</div>{to}</div>
    </div>
  </div>;
}

const TOPICS: { icon: ReactNode; label: string; category?: Category; to?: "/spending" | "/grooming-gangs-inquiry" | "/preparedness" | "/world" }[] = [
  { icon: <ShoppingCart className="size-5" />, label: "Cost of living", category: "Cost of living" },
  { icon: <Ship className="size-5" />, label: "Irregular immigration", category: "Irregular immigration & cost" },
  { icon: <Siren className="size-5" />, label: "Crime", category: "Crime" },
  { icon: <Coins className="size-5" />, label: "Public finances", category: "Finance" },
  { icon: <Building2 className="size-5" />, label: "Council spending", to: "/spending" },
  { icon: <Home className="size-5" />, label: "Housing", category: "Housing" },
  { icon: <CloudFog className="size-5" />, label: "Weather", category: "Weather" },
  { icon: <ShieldCheck className="size-5" />, label: "National alerts", category: "National alerts" },
  { icon: <Scale className="size-5" />, label: "Grooming gangs inquiry", to: "/grooming-gangs-inquiry" },
  { icon: <Backpack className="size-5" />, label: "Preparedness", to: "/preparedness" },
  { icon: <Globe2 className="size-5" />, label: "World & countries", to: "/world" },
];

function NewHome() {
  const { data } = useSuspenseQuery(statsQuery);
  const by = (id: string) => data.metrics.find((m) => m.id === id && m.value != null);
  const debt = by("uk-national-debt"), debtGdp = by("uk-debt-gdp"), boats = by("uk-small-boats-daily"), week = by("uk-small-boats-week");
  const terror = by("uk-threat-level"), met = by("uk-metoffice-warnings"), flood = by("uk-flood-warnings"), cpih = by("uk-cpih"), crime = by("uk-street-crime");
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const ticker = [boats && `Home Office: ${boats.value} irregular arrivals detected (${boats.period ?? fmtDate(boats.asOf)})`, met && `Met Office: ${met.value}`, terror && `Terror threat level: ${terror.value}`, cpih && `ONS: CPIH inflation ${cpih.value}`, debt && `ONS: net debt ${debt.value}`].filter(Boolean) as string[];

  return <div className="min-h-screen bg-background text-foreground">
    <div aria-label="Latest official figures" className="flex h-9 items-center overflow-hidden bg-onair text-sm font-semibold text-desk-fg">
      <span className="flex h-full shrink-0 items-center gap-1.5 bg-desk-fg px-3 font-black tracking-widest text-onair">● LIVE</span>
      <div className="min-w-0 flex-1 overflow-hidden"><div className="ticker-track flex w-max">{[0, 1].map((r) => <div key={r} aria-hidden={r === 1 || undefined} className="flex shrink-0">{ticker.map((t) => <span key={t} className="shrink-0 border-r border-desk-fg/30 px-5">{t}</span>)}</div>)}</div></div>
    </div>
    <SiteHeader />

    <main className="mx-auto max-w-7xl px-4 sm:px-6">
      <section className="relative py-12 text-center sm:py-16">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">UK public sector net debt · {debt?.source ?? "ONS"} · {debt?.period ?? "Not published"}</p>
        <h1 className="mt-4 bg-gradient-to-b from-foreground to-primary bg-clip-text font-mono text-6xl font-semibold tracking-tighter text-transparent sm:text-8xl lg:text-9xl">{debt?.value ?? "Not published"}</h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">{debtGdp ? `${debtGdp.value} of GDP` : ""}{debt?.change ? ` · ${debt.change.label}` : ""}{debt?.nextDue ? ` · next release ${dueLabel(debt.nextDue)}` : ""}</p>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-alert-green/50 bg-alert-green/15 px-4 py-1.5 text-sm font-semibold"><ShieldCheck className="size-4" />Free forever · official sources only · no account</p>
        <form role="search" onSubmit={(e) => { e.preventDefault(); void navigate({ to: "/register", search: { q: q.trim() || undefined, category: undefined } }); }} className="mx-auto mt-6 flex max-w-2xl items-center gap-2 rounded-2xl border border-border bg-card p-1.5 pl-4 shadow-sm">
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="nh-q" className="sr-only">Search UK figures</label>
          <input id="nh-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search debt, small boats, inflation…" className="min-w-0 flex-1 bg-transparent py-2.5 outline-none" />
          <button className="shrink-0 rounded-xl bg-primary px-5 py-2.5 font-bold text-primary-foreground">Search</button>
        </form>
      </section>

      <section aria-label="The UK right now" className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
        <Tile m={terror} icon={<ShieldCheck className="size-5" />} label="National terrorism threat level" link={{ category: "National alerts" }} />
        <Tile m={met} icon={<CloudFog className="size-5" />} label="Met Office weather warnings" link={{ category: "National alerts" }} />
        <Tile m={flood} icon={<Waves className="size-5" />} label="Flood alerts and warnings" link={{ category: "National alerts" }} />
        <Tile m={boats} icon={<Ship className="size-5" />} label="Small-boat arrivals, latest day" link={{ category: "Irregular immigration & cost" }} />
        <Tile m={cpih} icon={<ShoppingCart className="size-5" />} label="CPIH inflation, annual rate" link={{ category: "Cost of living" }} />
        <Tile m={crime} icon={<Siren className="size-5" />} label={crime?.title ?? "Crime"} link={{ category: "Crime" }} />
      </section>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">Red and yellow are the publisher's own warning levels.</p>

      <section aria-label="Lead story" className="relative mt-8 overflow-hidden rounded-3xl border border-border">
        <img src={channel.url} alt="The white cliffs of Dover at dusk" width={1280} height={720} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/10" />
        <div className="relative max-w-2xl p-6 sm:p-12">
          <span className="inline-flex items-center gap-2 rounded-md bg-onair px-3 py-1 text-xs font-black uppercase tracking-widest text-desk-fg"><Ship className="size-4" />Borders · latest figure</span>
          <h2 className="mt-4 text-4xl font-black leading-none tracking-tight sm:text-6xl">Small-boat arrivals</h2>
          <div className="mt-3 font-mono text-7xl font-semibold tracking-tighter sm:text-8xl">{boats?.value ?? "Not published"}</div>
          <p className="mt-3 text-base">{week ? `${week.value} in the last 7 days (${week.period ?? ""}).` : "Seven-day total not published."}</p>
          <p className="mt-2 font-mono text-xs text-muted-foreground"><Meta m={boats} /></p>
          <Link to="/register" search={{ category: "Irregular immigration & cost", q: undefined }} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 font-bold text-background">All small-boat figures <ArrowRight className="size-4" /></Link>
        </div>
      </section>

      <section className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <PhotoTile wide img={westminster.url} icon={<Landmark className="size-5" />} title={debt?.value ?? "Not published"} sub={`Public sector net debt${debtGdp ? ` · ${debtGdp.value} of GDP` : ""}`} meta={<Meta m={debt} />} to={null} />
        <PhotoTile wide img={fog.url} icon={<Building2 className="size-5" />} title="Council spending" sub="Every council's official return, 24 categories" meta="Links to each nation's own published returns" to={<Link to="/spending" search={{}} className="mt-2 inline-flex items-center gap-1 text-sm font-bold underline">Open spending <ArrowRight className="size-4" /></Link>} />
      </section>

      <section aria-label="Topics" className="mt-12">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Explore every topic</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {TOPICS.map((t) => {
            const inner = <span className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted"><span className="text-primary">{t.icon}</span>{t.label}</span>;
            return t.category ? <Link key={t.label} to="/register" search={{ category: t.category, q: undefined }}>{inner}</Link>
              : t.to === "/world" ? <Link key={t.label} to="/world" search={{ figure: undefined }}>{inner}</Link>
              : t.to === "/spending" ? <Link key={t.label} to="/spending" search={{}}>{inner}</Link>
              : <Link key={t.label} to={t.to!}>{inner}</Link>;
          })}
          <Link to="/register" search={{ q: undefined, category: undefined }}><span className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted"><BarChart3 className="size-5 text-primary" />All UK figures →</span></Link>
        </div>
      </section>

      <section aria-label="Live stream" className="mt-12">
        <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight sm:text-3xl"><Tv className="size-6" />UKStats Live</h2>
        <div className="mt-4"><LiveStreamPanel /></div>
      </section>

      <section className="mt-12 flex flex-col gap-4 border-t-4 border-onair pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xl font-black">Stats are free. Your brand on them is what keeps them free.</p><p className="mt-1 text-muted-foreground">Branded widgets, dashboards and stream backdrops from £9/month. Sponsor the 24/7 live stream.</p></div>
        <div className="flex shrink-0 gap-2"><Link to="/rent" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">See paid services <ArrowRight className="size-4" /></Link><Link to="/advertise" className="inline-flex items-center rounded-xl border border-border px-5 py-3 font-bold">Sponsor</Link></div>
      </section>
      <p className="mt-6 pb-10 font-mono text-[11px] text-muted-foreground">Preview of the new home page · figures checked {fmtDate(data.fetchedAt)} · photos are decoration only.</p>
    </main>
    <SiteFooter fetchedAt={data.fetchedAt} />
  </div>;
}
