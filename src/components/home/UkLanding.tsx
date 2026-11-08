import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import heroNetwork from "@/assets/hero-network.jpg";
import { SLOGAN } from "@/lib/brand";
import { Search, ArrowRight, ShieldCheck, Ship, CloudFog, Waves, ShoppingCart, Siren, Landmark, Building2, Home, Scale, Backpack, Globe2, Tv, Coins, BarChart3, FileText } from "lucide-react";
import { ageLabel, dueLabel, freshnessOf, fmtDate, type Category, type Metric, type StatsPayload } from "@/lib/uk-stats";
import { statusTone, type BlockTone } from "@/lib/status-tone";
import { GlobeExplorer, type GlobeState } from "@/components/globe/GlobeExplorer";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LiveStreamPanel } from "@/components/LiveStreamPanel";
import { IndependentWorksCta } from "@/components/home/IndependentWorksCta";
import channel from "@/assets/uk-channel.jpg.asset.json";
import fog from "@/assets/uk-fog.jpg.asset.json";
import westminster from "@/assets/uk-westminster.jpg.asset.json";

type HomeSearch = { c?: string | undefined; ind?: string | undefined };
type GlobeProps = { search: HomeSearch; onSearchChange: (search: HomeSearch) => void };

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
      {m && (tone !== "plain" || m.scale || freshnessOf(m) !== "unknown") && <span className="shrink-0 rounded-full bg-background/20 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider">{tone !== "plain" ? "official level" : m.scale ? "current" : freshnessOf(m) === "unknown" ? "" : freshnessOf(m)}</span>}
    </div>
    <div className="min-w-0">
      <div className="font-mono text-2xl font-semibold leading-tight tracking-tight [overflow-wrap:anywhere] sm:text-3xl">{m?.value ?? "Not published"}</div>
      <div className="mt-0.5 text-sm font-bold">{label}</div>
      <div className="mt-1 font-mono text-[11px] opacity-80 [overflow-wrap:anywhere]"><Meta m={m} /></div>
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

const TOPICS: { icon: ReactNode; label: string; category?: Category; to?: "/spending" | "/grooming-gangs-inquiry" | "/scandals" | "/preparedness" | "/world" }[] = [
  { icon: <ShoppingCart className="size-5" />, label: "Cost of living", category: "Cost of living" },
  { icon: <Ship className="size-5" />, label: "Irregular immigration", category: "Irregular immigration & cost" },
  { icon: <Siren className="size-5" />, label: "Crime", category: "Crime" },
  { icon: <Coins className="size-5" />, label: "Public finances", category: "Finance" },
  { icon: <Building2 className="size-5" />, label: "Council spending", to: "/spending" },
  { icon: <Home className="size-5" />, label: "Housing", category: "Housing" },
  { icon: <CloudFog className="size-5" />, label: "Weather", category: "Weather" },
  { icon: <ShieldCheck className="size-5" />, label: "National alerts", category: "National alerts" },
  { icon: <Scale className="size-5" />, label: "Grooming gangs inquiry", to: "/grooming-gangs-inquiry" },
  { icon: <Scale className="size-5" />, label: "Scandals", to: "/scandals" },
  { icon: <Backpack className="size-5" />, label: "Preparedness", to: "/preparedness" },
  { icon: <Globe2 className="size-5" />, label: "World & countries", to: "/world" },
];

function HomeGlobe({ search, onSearchChange }: GlobeProps) {
  const [layers, setLayers] = useState<Pick<GlobeState, "riots" | "protests" | "mil" | "m" | "layer" | "gov" | "age" | "cmp" | "feed" | "fk" | "fa" | "fl" | "fp" | "mg" | "nw" | "eq" | "st" | "cam">>({});
  const state: GlobeState = { c: search.c ?? "united kingdom", ind: search.ind ?? "none", official: true, acled: true, ...layers };
  return <section id="new-home-globe" aria-label="World globe" className="mt-8 scroll-mt-20">
    <a href="#new-home-services" className="mb-2 inline-flex min-h-11 items-center text-sm text-primary underline sm:hidden">Skip the globe — go to the next section</a>
    <GlobeExplorer compact state={state} onChange={(p) => { setLayers((l) => ({ ...l, ...(["layer", "gov", "age", "cmp", "feed", "fk", "fa", "fl", "fp", "mg", "nw", "eq", "st", "cam"] as const).reduce((o, k) => (k in p ? { ...o, [k]: p[k] } : o), {}), ...("riots" in p ? { riots: p.riots } : {}), ...("protests" in p ? { protests: p.protests } : {}), ...("mil" in p ? { mil: p.mil } : {}), ...("m" in p ? { m: p.m } : "c" in p ? { m: undefined } : {}) })); onSearchChange({ ...search, c: "c" in p ? p.c || undefined : search.c, ind: p.ind ? (p.ind === "none" ? undefined : p.ind) : search.ind }); }} />
  </section>;
}

export function UkLanding({ data, search, onSearchChange, additionalContent }: GlobeProps & { data: StatsPayload; additionalContent?: ReactNode }) {
  const by = (id: string) => data.metrics.find((m) => m.id === id && m.value != null);
  const debt = by("uk-national-debt"), debtGdp = by("uk-debt-gdp"), boats = by("uk-small-boats-daily"), week = by("uk-small-boats-week");
  const terror = by("uk-threat-level"), met = by("uk-metoffice-warnings"), flood = by("uk-flood-warnings"), cpih = by("uk-cpih"), crime = by("uk-street-crime");
  const ticker = [boats && `Home Office: ${boats.value} irregular arrivals detected (${boats.period ?? fmtDate(boats.asOf)})`, met && `Met Office: ${met.value}`, terror && `Terror threat level: ${terror.value}`, cpih && `ONS: CPIH inflation ${cpih.value}`, debt && `ONS: net debt ${debt.value}`].filter(Boolean) as string[];

  return <div className="min-h-screen bg-background text-foreground">
    <div aria-label="Latest official figures" className="flex h-9 items-center overflow-hidden bg-onair text-sm font-semibold text-desk-fg">
      <span className="flex h-full shrink-0 items-center gap-1.5 bg-desk-fg px-3 font-black tracking-widest text-onair">● LIVE</span>
      <div className="min-w-0 flex-1 overflow-hidden"><div className="ticker-track flex w-max">{[0, 1].map((r) => <div key={r} aria-hidden={r === 1 || undefined} className="flex shrink-0">{ticker.map((t) => <span key={t} className="shrink-0 border-r border-desk-fg/30 px-5">{t}</span>)}</div>)}</div></div>
    </div>
    <SiteHeader />

    <main id="main-content" tabIndex={-1} className="mx-auto max-w-7xl px-4 sm:px-6">
      <section className="relative mt-5 overflow-hidden rounded-3xl bg-night text-night-fg">
        <img src={heroNetwork} alt="" fetchPriority="high" width={1408} height={1024} className="absolute inset-y-0 right-0 h-full w-full object-cover opacity-70 sm:w-[62%]" />
        <div className="absolute inset-0 bg-linear-to-r from-night via-night/90 to-night/20" />
        <div className="relative grid gap-5 px-4 py-8 sm:px-6 sm:py-10 lg:max-w-[65%]">
          <div>
            <p className="mb-3 font-mono text-xs text-electric-soft">Official statistics · UK & worldwide</p>
            <h1 className="text-4xl font-semibold leading-tight text-balance sm:text-5xl">UKStats<span className="sr-only"> — live UK official statistics, sourced and dated</span></h1>
            <p className="mt-3 text-xl text-night-fg">{SLOGAN}</p>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-night-muted">Debt, prices, crime, migration and more — from official publishers. Every figure dated. Nothing guessed.</p>
          <form action="/register" method="get" role="search" className="flex max-w-xl flex-wrap gap-2">
            <label className="sr-only" htmlFor="home-stat-search">Find a UK statistic</label>
            <div className="relative min-w-0 flex-1 basis-48"><Search aria-hidden="true" className="absolute left-3 top-3.5 size-4 text-muted-foreground" /><input id="home-stat-search" name="q" type="search" placeholder="Find debt, inflation, crime…" className="min-h-11 w-full rounded-md border border-input bg-background py-2 pr-3 pl-10 text-foreground" /></div>
            <Button type="submit"><ArrowRight aria-hidden="true" />Find figures</Button>
          </form>
          <div className="flex flex-wrap gap-2">
            <Button asChild><a href="#new-home-globe"><Globe2 />Open interactive globe<ArrowRight /></a></Button>
            <Button asChild variant="outline"><Link to="/register">All UK statistics<ArrowRight /></Link></Button>
            <Button asChild variant="ghost"><Link to="/countries"><Globe2 />Explore countries</Link></Button>
            <Button asChild variant="ghost"><Link to="/safest-places" search={{ country: "uk" }}><ShieldCheck />Safest places</Link></Button>
            <Button asChild variant="outline"><Link to="/reports"><FileText />Daily, monthly & yearly PDF reports</Link></Button>
          </div>
          <p className="max-w-xl text-sm text-night-muted">Every stat you can see on UKStats stays completely free, forever. Reports are an optional download-ready PDF from £1.</p>
        </div>
      </section>

      <section className="relative py-12 text-center sm:py-16">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">UK public sector net debt · {debt?.source ?? "ONS"} · {debt?.period ?? "Not published"}</p>
        <p className="mt-4 bg-gradient-to-b from-foreground to-primary bg-clip-text font-mono text-6xl font-semibold tracking-tighter text-transparent sm:text-8xl lg:text-9xl">{debt?.value ?? "Not published"}</p>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">{debtGdp ? `${debtGdp.value} of GDP` : ""}{debt?.change ? ` · ${debt.change.label}` : ""}{debt?.nextDue ? ` · next release ${dueLabel(debt.nextDue)}` : ""}</p>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-alert-green/50 bg-alert-green/15 px-4 py-1.5 text-sm font-semibold"><ShieldCheck className="size-4" />Free forever · official sources only · no account</p>
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

      <IndependentWorksCta />

      <section aria-label="Lead story" id="new-home-lead" className="relative mt-8 scroll-mt-20 overflow-hidden rounded-3xl border border-border">
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
              : t.to ? <Link key={t.label} to={t.to}>{inner}</Link> : null;
          })}
          <Link to="/register" search={{ q: undefined, category: undefined }}><span className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted"><BarChart3 className="size-5 text-primary" />All UK figures →</span></Link>
        </div>
      </section>

      <section aria-label="Live stream" className="mt-12">
        <h2 className="flex items-center gap-2 text-2xl font-black tracking-tight sm:text-3xl"><Tv className="size-6" />UKStats Live</h2>
        <div className="mt-4"><LiveStreamPanel /></div>
      </section>

      <HomeGlobe search={search} onSearchChange={onSearchChange} />

      <section id="new-home-services" className="mt-12 flex scroll-mt-20 flex-col gap-4 border-t-4 border-onair pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xl font-black">Stats are free. Your brand on them is what keeps them free.</p><p className="mt-1 text-muted-foreground">Branded widgets, dashboards and stream backdrops from £9/month. Sponsor the 24/7 live stream.</p></div>
        <div className="flex shrink-0 flex-wrap gap-2"><Link to="/rent" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground">See paid services <ArrowRight className="size-4" /></Link><Link to="/reports" className="inline-flex items-center rounded-xl border border-border px-5 py-3 font-bold">Daily PDF report £1</Link><Link to="/rent/dashboard" className="inline-flex items-center rounded-xl border border-border px-5 py-3 font-bold">Brand your stream</Link><Link to="/advertise" className="inline-flex items-center rounded-xl border border-border px-5 py-3 font-bold">Sponsor</Link></div>
      </section>
      <p className="mt-6 pb-10 font-mono text-[11px] text-muted-foreground">Figures checked {fmtDate(data.fetchedAt)} · photos are decoration only.</p>
      {additionalContent}
    </main>
    <SiteFooter fetchedAt={data.fetchedAt} />
  </div>;
}
