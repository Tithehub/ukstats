import { ClientOnly, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ArrowRight, ExternalLink, Maximize2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { worldQuery } from "@/lib/world.functions";
import { unrestQuery } from "@/lib/unrest.functions";
import { WORLD_INDICATORS, WORLD_SOURCE, MAX_LAG_YEARS, fmtWorld, rankIndicator } from "@/lib/world";
import { countryKey, unrestHotspots, unrestMarkers, warningAge, type OfficialWarning, type UnrestMarker } from "@/lib/unrest";
import { UNREST_PLACES } from "@/lib/unrest-places.data";
import type { GlobeMarker } from "@/components/globe/EarthGlobe";
import { GLOBAL_NEWS, LIVE_SOURCES, LIVE_SOURCES_CHECKED } from "@/lib/live-sources.data";
import { countryDestinations, type Destination } from "@/lib/globe-destinations";
import { fmtDate } from "@/lib/uk-stats";

const EarthGlobe = lazy(() => import("@/components/globe/EarthGlobe"));

export type GlobeState = { ind: string; official: boolean; acled: boolean; c: string; riots?: boolean | undefined; protests?: boolean | undefined; m?: string | undefined };

/** Date and time in UK time, for official publication stamps. */
function fmtStamp(iso: string | null) {
  if (!iso) return "time not stated";
  const t = new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
  return `${fmtDate(iso)}, ${t} UK time`;
}

const AGE_CLS = { fresh: "text-fresh", ageing: "text-ageing", overdue: "text-overdue", unknown: "text-night-muted" } as const;
const LINK = "inline-flex min-h-10 items-center justify-between gap-2 rounded border border-night-line px-3 py-2 text-sm hover:bg-night";

function WarningRow({ w }: { w: OfficialWarning }) {
  const age = warningAge(w.updated, new Date());
  return <li className="rounded border border-night-line p-3">
    <p className="font-mono text-[11px] uppercase text-night-muted">{w.source}{w.level ? ` · Level ${w.level}` : ""}</p>
    <p className="mt-1 text-sm">“{w.text || "No change note published"}”</p>
    <p className={`mt-1 font-mono text-[11px] ${AGE_CLS[age]}`}>Updated {fmtDate(w.updated)} · {age}</p>
    <a href={w.url} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 text-xs underline">Read the official advice <ExternalLink className="size-3" /></a>
  </li>;
}

function DestLink({ d }: { d: Destination }) {
  const inner = <>{d.label}<ArrowRight className="size-3.5 shrink-0" aria-hidden="true" /></>;
  switch (d.kind) {
    case "uk-register": return <Link to="/register" className={LINK}>{inner}</Link>;
    case "uk-small-boats": return <Link to="/small-boats" className={LINK}>{inner}</Link>;
    case "uk-maps": return <Link to="/maps" className={LINK}>{inner}</Link>;
    case "uk-parties": return <Link to="/parties" search={{ view: "election" }} className={LINK}>{inner}</Link>;
    case "uk-polling": return <Link to="/polling" className={LINK}>{inner}</Link>;
    case "uk-preparedness": return <Link to="/preparedness" search={{ region: "all", q: "" }} className={LINK}>{inner}</Link>;
    case "preparedness": return <Link to="/preparedness" search={{ region: "all", q: d.q }} className={LINK}>{inner}</Link>;
    case "country-stats": return <Link to="/$country" params={{ country: d.code }} className={LINK}>{inner}</Link>;
    case "safest": return <Link to="/safest-places" search={{ country: d.code }} className={LINK}>{inner}</Link>;
    case "world-profile": return <Link to="/world/$iso" params={{ iso: d.iso }} className={LINK}>{inner}</Link>;
    case "world-compare": return <Link to="/world-compare" search={{ countries: d.countries }} className={LINK}>{inner}</Link>;
  }
}

function hasWebGL() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}

/** The globe plus its control panel, shared by the home page and /globe. */
export function GlobeExplorer({ state: s, onChange, compact = false }: { state: GlobeState; onChange: (p: Partial<GlobeState>) => void; compact?: boolean }) {
  const { data: world } = useQuery(worldQuery());
  const { data: unrest } = useQuery(unrestQuery());
  const [gl, setGl] = useState<boolean | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => { setGl(hasWebGL()); }, []);

  const ind = WORLD_INDICATORS.find((i) => i.slug === s.ind) ?? null;
  const byKey = useMemo(() => new Map((world?.countries ?? []).map((c) => [countryKey(c.name), c])), [world]);
  const names = useMemo(() => [...(world?.countries ?? [])].sort((a, b) => a.name.localeCompare(b.name)), [world]);
  const shade = useMemo(() => {
    if (!ind || !world) return null;
    const ranked = rankIndicator(world, ind).filter((r) => r.rank !== null);
    const n = ranked.length;
    return new Map(ranked.map((r) => [countryKey(r.country.name), n > 1 ? 1 - (r.rank! - 1) / (n - 1) : 1]));
  }, [ind, world]);
  const hot = useMemo(() => (unrest && s.official ? unrestHotspots(unrest.warnings, new Date()) : new Map<string, OfficialWarning[]>()), [unrest, s.official]);
  const hotKeys = useMemo(() => new Set(hot.keys()), [hot]);
  const events = s.acled && unrest?.acled.connected ? unrest.acled.events : [];
  const showRiots = s.riots !== false, showProtests = s.protests !== false;
  const official = useMemo(() => (unrest && s.official ? unrestMarkers(unrest.warnings, new Date(), UNREST_PLACES) : []), [unrest, s.official]);
  const visible = official.filter((m) => (m.kind === "riot" ? showRiots : showProtests));
  const research: GlobeMarker[] = events.flatMap((e) => {
    const k: "riot" | "protest" | null = /riot/i.test(e.type) ? "riot" : /protest/i.test(e.type) ? "protest" : null;
    if (!k || (k === "riot" ? !showRiots : !showProtests)) return [];
    return [{ id: `acled|${e.id}`, kind: k, lat: e.lat, lng: e.lng, label: `${e.subType || e.type} — ${e.location}, ${e.date} (ACLED research, not official)`, research: true }];
  }).slice(0, 150);
  const markers: GlobeMarker[] = [...visible.map((m) => ({ id: m.id, kind: m.kind, lat: m.lat, lng: m.lng, label: `${m.kind === "riot" ? "Riot" : "Protest"} warning — ${m.place}, ${m.country} (${m.warning.source})` })), ...research];
  const marker: UnrestMarker | undefined = s.m ? official.find((m) => m.id === s.m) : undefined;
  const pick = (m: UnrestMarker) => onChange({ c: m.key, m: m.id });

  const sel = s.c || null;
  const wb = sel ? byKey.get(sel) : undefined;
  const warnings = sel ? (unrest?.warnings ?? []).filter((w) => w.key === sel) : [];
  const live = sel ? LIVE_SOURCES[sel] : undefined;
  const selName = wb?.name ?? warnings[0]?.country ?? sel;
  const dests = sel ? countryDestinations(wb?.iso2 ?? (sel === "united kingdom" ? "GB" : ""), wb?.iso3 ?? null, selName ?? "") : [];
  const hotList = [...hot.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const find = (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim().toLowerCase();
    if (!t) return;
    const m = names.find((c) => c.name.toLowerCase() === t) ?? names.find((c) => c.name.toLowerCase().startsWith(t)) ?? names.find((c) => c.name.toLowerCase().includes(t));
    if (m) { onChange({ c: countryKey(m.name) }); setQ(""); }
  };

  const loading = <div className="grid h-full place-items-center text-sm text-night-muted">Loading globe…</div>;
  const height = compact ? "h-[52vh] min-h-[340px] max-h-[620px]" : "h-[60vh] min-h-[380px] lg:h-auto";

  const ticker = <div aria-label="Latest official riot and protest warnings" className="flex items-center gap-2 overflow-x-auto border-b border-night-line bg-night-panel px-3 py-2 text-xs">
    <span className="shrink-0 font-mono uppercase text-overdue"><span className="mr-1 inline-block size-1.5 rounded-full bg-overdue pulse-dot" />Official warnings</span>
    {!unrest ? <span className="text-night-muted">Checking official feeds…</span> : !s.official ? <span className="text-night-muted">Official layer switched off.</span> : official.length === 0 ? <span className="text-night-muted">No riot or protest wording in official advice in the last 30 days.</span> :
      official.slice(0, 12).map((m) => <button key={m.id} onClick={() => pick(m)} className={`shrink-0 rounded border px-2 py-1 hover:bg-night ${m.id === s.m ? "border-electric" : "border-night-line"}`}>
        <b className={m.kind === "riot" ? "text-overdue" : "text-ageing"}>{m.kind === "riot" ? "Riot" : "Protest"}</b> {m.place}{m.unspecified ? "*" : ""}, {m.country} · <span className="text-night-muted">{m.warning.source} {fmtStamp(m.warning.updated)}</span>
      </button>)}
    {unrest && <span className="shrink-0 text-night-muted">· checked {fmtStamp(unrest.fetchedAt)}</span>}
  </div>;

  return <div className={compact ? "overflow-hidden rounded-lg border border-night-line" : "flex flex-1 flex-col"}>{ticker}<div className={`relative flex flex-col bg-night text-night-fg lg:flex-row ${compact ? "" : "flex-1"}`}>
    <section aria-label="Interactive globe" className={`relative flex-1 ${height}`}>
      {gl === false ? <div className="h-full overflow-y-auto p-4 pt-44">
        <p className="text-sm text-night-muted">Your device can't show the 3D globe. Pick a country instead:</p>
        <ul className="mt-2 grid grid-cols-2 gap-1 text-sm sm:grid-cols-3">{names.map((c) => <li key={c.iso3}><button className="w-full rounded px-2 py-1 text-left hover:bg-night-panel" onClick={() => onChange({ c: countryKey(c.name) })}>{c.name}</button></li>)}</ul>
      </div> : <ClientOnly fallback={loading}><Suspense fallback={loading}>
        {gl && <EarthGlobe shade={shade} hotspots={hotKeys} events={research.length ? [] : events} selected={sel} onSelect={(k) => onChange({ c: k, m: undefined })} markers={markers} onMarker={(id) => { const m = official.find((x) => x.id === id); if (m) pick(m); }} focus={marker ? { lat: marker.lat, lng: marker.lng } : null} />}
      </Suspense></ClientOnly>}
      <div className="absolute left-3 top-3 max-w-[92%] rounded-md border border-night-line bg-night-panel/90 p-3 text-xs backdrop-blur sm:max-w-sm">
        {compact ? <h2 className="text-base font-semibold">Explore the world — click any country</h2> : <h1 className="text-base font-semibold">World globe</h1>}
        <form onSubmit={find} role="search" className="mt-2 flex gap-1">
          <label htmlFor={compact ? "globe-q-home" : "globe-q"} className="sr-only">Find a country</label>
          <div className="relative flex-1"><Search aria-hidden="true" className="absolute left-2 top-2 size-3.5 text-night-muted" />
            <input id={compact ? "globe-q-home" : "globe-q"} list="globe-country-names" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a country…" className="w-full rounded border border-night-line bg-night py-1.5 pr-2 pl-7" />
          </div>
          <Button type="submit" size="sm">Go</Button>
          <datalist id="globe-country-names">{names.map((c) => <option key={c.iso3} value={c.name} />)}</datalist>
        </form>
        <label className="mt-2 block">Colour by
          <select value={s.ind} onChange={(e) => onChange({ ind: e.target.value })} className="ml-2 max-w-[60%] rounded border border-night-line bg-night px-2 py-1">
            <option value="none">Nothing</option>
            {WORLD_INDICATORS.map((i) => <option key={i.slug} value={i.slug}>{i.label}</option>)}
          </select>
        </label>
        {ind && <p className="mt-1 text-night-muted">Brighter = higher rank. Grey = no figure within {MAX_LAG_YEARS} years of the newest. Source: {WORLD_SOURCE.name}.</p>}
        <label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={s.official} onChange={(e) => onChange({ official: e.target.checked })} /> <span><b className="text-overdue">Red</b>: official warnings mentioning unrest (30 days)</span></label>
        <label className="mt-1 flex items-center gap-2"><input type="checkbox" checked={s.acled} onChange={(e) => onChange({ acled: e.target.checked })} /> <span><b className="text-ageing">Dots</b>: ACLED research — {unrest?.acled.connected ? `${events.length} events, 30 days` : "Not connected"}</span></label>
        <div className="mt-2 flex gap-3">
          <label className="flex items-center gap-1"><input type="checkbox" checked={showRiots} onChange={(e) => onChange({ riots: e.target.checked })} /> Riots</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={showProtests} onChange={(e) => onChange({ protests: e.target.checked })} /> Protests</label>
        </div>
        {compact && <Link to="/globe" search={s} className="mt-2 inline-flex items-center gap-1 text-electric-soft underline"><Maximize2 className="size-3" />Open full-screen globe</Link>}
      </div>
    </section>

    <aside aria-label="Country controls" className={`w-full overflow-y-auto border-t border-night-line bg-night-panel p-4 lg:w-[380px] lg:border-l lg:border-t-0 ${compact ? "max-h-[620px]" : "lg:max-h-[calc(100dvh-64px)]"}`}>
      {unrest ? <p className="font-mono text-[11px] text-night-muted">Checked {fmtDate(unrest.fetchedAt)} · UK FCDO {unrest.fcdoOk ? "answered" : "unavailable"} · US State Dept {unrest.stateOk ? "answered" : "unavailable"}</p>
        : <p className="font-mono text-[11px] text-night-muted">Loading official warning feeds…</p>}

      {sel ? <div className="mt-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-2xl font-semibold">{selName}</h2>
          <Button variant="ghost" size="icon" aria-label="Close country" onClick={() => onChange({ c: "", m: undefined })}><X className="size-4" /></Button>
        </div>
        {marker && marker.key === sel && <div className={`mt-3 rounded border p-3 ${marker.kind === "riot" ? "border-overdue/60" : "border-ageing/60"}`}>
          <p className={`font-mono text-[11px] uppercase ${marker.kind === "riot" ? "text-overdue" : "text-ageing"}`}>{marker.kind === "riot" ? "Riot" : "Protest"} warning · {marker.place}{marker.unspecified ? " (country-wide advice — location not specified)" : ""}</p>
          <p className="mt-1 text-sm">“{marker.warning.text}”</p>
          <p className={`mt-1 font-mono text-[11px] ${AGE_CLS[warningAge(marker.warning.updated, new Date())]}`}>{marker.warning.source} · published {fmtStamp(marker.warning.updated)} · {warningAge(marker.warning.updated, new Date())}</p>
          <a href={marker.warning.url} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 text-xs underline">Read the official advice <ExternalLink className="size-3" /></a>
        </div>}
        {dests.length > 0 && <nav aria-label={`Pages for ${selName}`} className="mt-3 grid gap-1.5">{dests.map((d) => <DestLink key={d.kind + d.label} d={d} />)}</nav>}
        {wb ? <>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {WORLD_INDICATORS.slice(0, 6).map((i) => { const v = world?.values[i.id]?.[wb.iso3]; return <div key={i.id} className="rounded border border-night-line p-2"><dt className="text-[11px] text-night-muted">{i.label}</dt><dd className="font-mono">{v ? `${fmtWorld(v.value, i.unit)} (${v.year})` : "Not published"}</dd></div>; })}
          </dl>
          <p className="mt-1 text-[11px] text-night-muted">Source: <a className="underline" href={WORLD_SOURCE.url} target="_blank" rel="noreferrer noopener">{WORLD_SOURCE.name}</a></p>
        </> : <p className="mt-2 text-sm text-night-muted">No World Bank profile for this territory.</p>}

        <h3 className="mt-5 font-semibold">Official government warnings</h3>
        {warnings.length ? <ul className="mt-2 space-y-2">{warnings.map((w) => <WarningRow key={w.source + w.url} w={w} />)}</ul> : <p className="mt-1 text-sm text-night-muted">No UK or US travel advice found for this country.</p>}

        <h3 className="mt-5 font-semibold">Official news and broadcasts</h3>
        {live?.official.length ? <ul className="mt-1 space-y-1 text-sm">{live.official.map((l) => <li key={l.url}><a className="underline" href={l.url} target="_blank" rel="noreferrer noopener">{l.label}</a></li>)}</ul> : <p className="mt-1 text-sm text-night-muted">Not yet verified for this country.</p>}

        <h3 className="mt-5 font-semibold">News coverage <span className="text-xs font-normal text-night-muted">(not official)</span></h3>
        <ul className="mt-1 space-y-1 text-sm">{[...(live?.news ?? []), ...GLOBAL_NEWS].map((l) => <li key={l.url}><a className="underline" href={l.url} target="_blank" rel="noreferrer noopener">{l.label}</a></li>)}</ul>
        <p className="mt-2 text-[11px] text-night-muted">Links checked {fmtDate(LIVE_SOURCES_CHECKED)}.</p>
      </div> : <div className="mt-3">
        <h2 className="text-lg font-semibold">Click a country to open its pages</h2>
        <p className="mt-1 text-xs text-night-muted">Each country shows its key figures and buttons to every UKStats page we have for it.</p>
        <button className="mt-3 w-full rounded border border-electric/50 px-3 py-2 text-left text-sm hover:bg-night" onClick={() => onChange({ c: "united kingdom" })}><b>United Kingdom</b> <span className="text-xs text-night-muted">· all UK statistics, small boats, crime, parties…</span></button>
        <h3 className="mt-5 font-semibold">Countries flagged for unrest</h3>
        <p className="mt-1 text-xs text-night-muted">Where the UK Foreign Office or US State Department mentioned protests, riots, strikes, curfews or a coup in their latest update within 30 days, quoted in their own words.</p>
        {hotList.length ? <ul className="mt-3 space-y-1 text-sm">{hotList.map(([k, ws]) => <li key={k}><button className="w-full rounded border border-night-line px-3 py-2 text-left hover:bg-night" onClick={() => onChange({ c: k })}><b>{ws[0]!.country}</b> <span className="text-xs text-night-muted">· {ws.map((w) => w.source).join(", ")} · {fmtDate(ws[0]!.updated)}</span></button></li>)}</ul> : <p className="mt-3 text-sm text-night-muted">{!unrest ? "Waiting for the official feeds." : s.official ? "None in the last 30 days." : "Official layer is switched off."}</p>}
        <p className="mt-4 text-[11px] text-night-muted">Governments publish travel advice, not live riot maps. ACLED is an independent research body, not a government source.</p>
      </div>}
    </aside>
  </div>
  <p className="border-t border-night-line bg-night-panel px-3 py-2 text-[11px] text-night-muted">Governments publish travel advice, not live riot feeds: markers appear when their advice is updated, checked every 15 minutes, and always show the government's own publication time. * Advice names no place — marker shows the capital, not the exact spot. Places: Natural Earth.</p>
  </div>;
}
