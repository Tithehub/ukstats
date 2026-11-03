import { createFileRoute, Link, ClientOnly } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { lazy, Suspense, useMemo } from "react";
import { ExternalLink, X } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/button";
import { worldQuery } from "@/lib/world.functions";
import { unrestQuery } from "@/lib/unrest.functions";
import { WORLD_INDICATORS, WORLD_SOURCE, MAX_LAG_YEARS, fmtWorld, rankIndicator } from "@/lib/world";
import { countryKey, unrestHotspots, warningAge, type OfficialWarning } from "@/lib/unrest";
import { GLOBAL_NEWS, LIVE_SOURCES, LIVE_SOURCES_CHECKED } from "@/lib/live-sources.data";
import { fmtDate } from "@/lib/uk-stats";

const EarthGlobe = lazy(() => import("@/components/globe/EarthGlobe"));

type Search = { ind: string; official: boolean; acled: boolean; c: string };

export const Route = createFileRoute("/globe")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    ind: WORLD_INDICATORS.some((i) => i.slug === s["ind"]) ? String(s["ind"]) : "none",
    official: s["official"] !== false && s["official"] !== "false",
    acled: s["acled"] !== false && s["acled"] !== "false",
    c: typeof s["c"] === "string" ? s["c"].slice(0, 80) : "",
  }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(worldQuery()), context.queryClient.ensureQueryData(unrestQuery())]),
  head: () => ({ meta: [
    { title: "World globe — official unrest warnings & country stats | UKStats" },
    { name: "description", content: "Spin a 3D globe of official government unrest warnings from the UK Foreign Office and US State Department, with World Bank country rankings and source links." },
    { property: "og:title", content: "World globe — official unrest warnings and country stats" },
    { property: "og:description", content: "Interactive 3D globe: government travel warnings mentioning protests or unrest, plus World Bank rankings, every item dated and sourced." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ], links: [{ rel: "canonical", href: "https://ukstats.co.uk/globe" }] }),
  component: GlobePage,
});

const AGE_CLS = { fresh: "text-fresh", ageing: "text-ageing", overdue: "text-overdue", unknown: "text-night-muted" } as const;

function WarningRow({ w }: { w: OfficialWarning }) {
  const age = warningAge(w.updated, new Date());
  return <li className="rounded border border-night-line p-3">
    <p className="font-mono text-[11px] uppercase text-night-muted">{w.source}{w.level ? ` · Level ${w.level}` : ""}</p>
    <p className="mt-1 text-sm">“{w.text || "No change note published"}”</p>
    <p className={`mt-1 font-mono text-[11px] ${AGE_CLS[age]}`}>Updated {fmtDate(w.updated)} · {age}</p>
    <a href={w.url} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 text-xs underline">Read the official advice <ExternalLink className="size-3" /></a>
  </li>;
}

function GlobePage() {
  const s = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: world } = useSuspenseQuery(worldQuery());
  const { data: unrest } = useSuspenseQuery(unrestQuery());
  const set = (p: Partial<Search>) => void navigate({ search: { ...s, ...p }, replace: true });

  const ind = WORLD_INDICATORS.find((i) => i.slug === s.ind) ?? null;
  const byKey = useMemo(() => new Map((world?.countries ?? []).map((c) => [countryKey(c.name), c])), [world]);
  const shade = useMemo(() => {
    if (!ind || !world) return null;
    const ranked = rankIndicator(world, ind).filter((r) => r.rank !== null);
    const n = ranked.length;
    return new Map(ranked.map((r) => [countryKey(r.country.name), n > 1 ? 1 - (r.rank! - 1) / (n - 1) : 1]));
  }, [ind, world]);
  const hot = useMemo(() => (unrest && s.official ? unrestHotspots(unrest.warnings, new Date()) : new Map<string, OfficialWarning[]>()), [unrest, s.official]);
  const events = s.acled && unrest?.acled.connected ? unrest.acled.events : [];

  const sel = s.c || null;
  const wb = sel ? byKey.get(sel) : undefined;
  const warnings = sel ? (unrest?.warnings ?? []).filter((w) => w.key === sel) : [];
  const live = sel ? LIVE_SOURCES[sel] : undefined;
  const selName = wb?.name ?? warnings[0]?.country ?? sel;
  const hotList = [...hot.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return <div className="flex min-h-dvh flex-col bg-night text-night-fg">
    <SiteHeader />
    <main id="main-content" className="relative flex flex-1 flex-col lg:flex-row">
      <section aria-label="3D globe" className="relative h-[60vh] min-h-[380px] flex-1 lg:h-auto">
        <ClientOnly fallback={<div className="grid h-full place-items-center text-sm text-night-muted">Loading globe…</div>}>
          <Suspense fallback={<div className="grid h-full place-items-center text-sm text-night-muted">Loading globe…</div>}>
            <EarthGlobe shade={shade} hotspots={new Set(hot.keys())} events={events} selected={sel} onSelect={(k) => set({ c: k })} />
          </Suspense>
        </ClientOnly>
        <div className="absolute left-3 top-3 max-w-[92%] rounded-md border border-night-line bg-night-panel/90 p-3 text-xs backdrop-blur">
          <h1 className="text-base font-semibold">World globe</h1>
          <label className="mt-2 block">Colour by
            <select value={s.ind} onChange={(e) => set({ ind: e.target.value })} className="ml-2 rounded border border-night-line bg-night px-2 py-1">
              <option value="none">Nothing</option>
              {WORLD_INDICATORS.map((i) => <option key={i.slug} value={i.slug}>{i.label}</option>)}
            </select>
          </label>
          {ind && <p className="mt-1 text-night-muted">Brighter = higher rank. Grey = no figure within {MAX_LAG_YEARS} years of the newest. Source: {WORLD_SOURCE.name}.</p>}
          <label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={s.official} onChange={(e) => set({ official: e.target.checked })} /> <span><b className="text-overdue">Red</b>: official government warnings mentioning unrest (last 30 days)</span></label>
          <label className="mt-1 flex items-center gap-2"><input type="checkbox" checked={s.acled} onChange={(e) => set({ acled: e.target.checked })} /> <span><b className="text-ageing">Dots</b>: ACLED research — {unrest?.acled.connected ? `${events.length} riot/protest events, 30 days` : "Not connected"}</span></label>
        </div>
      </section>

      <aside className="w-full overflow-y-auto border-t border-night-line bg-night-panel p-4 lg:max-h-[calc(100dvh-64px)] lg:w-[400px] lg:border-l lg:border-t-0">
        {!unrest && <p className="text-sm text-overdue">The official warning feeds did not answer. No hotspots are shown rather than guessed.</p>}
        {unrest && <p className="font-mono text-[11px] text-night-muted">Checked {fmtDate(unrest.fetchedAt)} · UK FCDO {unrest.fcdoOk ? "answered" : "unavailable"} · US State Dept {unrest.stateOk ? "answered" : "unavailable"}</p>}

        {sel ? <div className="mt-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-2xl font-semibold">{selName}</h2>
            <Button variant="ghost" size="icon" aria-label="Close country" onClick={() => set({ c: "" })}><X className="size-4" /></Button>
          </div>
          {wb ? <>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {WORLD_INDICATORS.slice(0, 6).map((i) => { const v = world?.values[i.id]?.[wb.iso3]; return <div key={i.id} className="rounded border border-night-line p-2"><dt className="text-[11px] text-night-muted">{i.label}</dt><dd className="font-mono">{v ? `${fmtWorld(v.value, i.unit)} (${v.year})` : "Not published"}</dd></div>; })}
            </dl>
            <p className="mt-1 text-[11px] text-night-muted">Source: <a className="underline" href={WORLD_SOURCE.url} target="_blank" rel="noreferrer noopener">{WORLD_SOURCE.name}</a></p>
            <Link to="/world/$iso" params={{ iso: wb.iso3.toLowerCase() }} className="mt-2 inline-block text-sm underline">Full country profile and rankings →</Link>
          </> : <p className="mt-2 text-sm text-night-muted">No World Bank profile for this territory.</p>}

          <h3 className="mt-5 font-semibold">Official government warnings</h3>
          {warnings.length ? <ul className="mt-2 space-y-2">{warnings.map((w) => <WarningRow key={w.source + w.url} w={w} />)}</ul> : <p className="mt-1 text-sm text-night-muted">No UK or US travel advice found for this country.</p>}

          <h3 className="mt-5 font-semibold">Official live sources</h3>
          {live?.official.length ? <ul className="mt-1 space-y-1 text-sm">{live.official.map((l) => <li key={l.url}><a className="underline" href={l.url} target="_blank" rel="noreferrer noopener">{l.label}</a></li>)}</ul> : <p className="mt-1 text-sm text-night-muted">Not yet verified for this country.</p>}

          <h3 className="mt-5 font-semibold">News coverage <span className="text-xs font-normal text-night-muted">(not official)</span></h3>
          <ul className="mt-1 space-y-1 text-sm">{[...(live?.news ?? []), ...GLOBAL_NEWS].map((l) => <li key={l.url}><a className="underline" href={l.url} target="_blank" rel="noreferrer noopener">{l.label}</a></li>)}</ul>
          <p className="mt-2 text-[11px] text-night-muted">Links checked {fmtDate(LIVE_SOURCES_CHECKED)}.</p>
        </div> : <div className="mt-3">
          <h2 className="text-lg font-semibold">Countries flagged for unrest</h2>
          <p className="mt-1 text-xs text-night-muted">Where the UK Foreign Office or US State Department mentioned protests, demonstrations, riots, strikes, curfews or a coup in their latest update within 30 days. Quoted in their own words — click a country on the globe for details.</p>
          {hotList.length ? <ul className="mt-3 space-y-1 text-sm">{hotList.map(([k, ws]) => <li key={k}><button className="w-full rounded border border-night-line px-3 py-2 text-left hover:bg-night" onClick={() => set({ c: k })}><b>{ws[0]!.country}</b> <span className="text-xs text-night-muted">· {ws.map((w) => w.source).join(", ")} · {fmtDate(ws[0]!.updated)}</span></button></li>)}</ul> : <p className="mt-3 text-sm text-night-muted">{s.official ? "None in the last 30 days." : "Official layer is switched off."}</p>}
          <p className="mt-4 text-[11px] text-night-muted">Governments publish travel advice, not live riot maps: a country appears here only when its advice says so. ACLED is an independent research body, updated weekly, not a government source.</p>
        </div>}
      </aside>
    </main>
  </div>;
}
