import { ClientOnly, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ArrowRight, ExternalLink, Maximize2, Pause, Play, RotateCcw, Search, SkipForward, Layers, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { worldQuery } from "@/lib/world.functions";
import { unrestQuery } from "@/lib/unrest.functions";
import { WORLD_INDICATORS, WORLD_SOURCE, MAX_LAG_YEARS, fmtWorld } from "@/lib/world";
import { countryKey, filterWarningMarkers, travelAdviceLevel, unrestHotspots, unrestMarkers, warningAge, FCDO_ALERT_LABEL, US_LEVEL_LABEL, type FcdoAlert, type OfficialWarning, type UnrestMarker } from "@/lib/unrest";
import { statLayer, shadeColour, NO_FIGURE, UK_ALERT_COLOURS, US_LEVEL_COLOURS } from "@/lib/globe-legend";
import { UNREST_PLACES } from "@/lib/unrest-places.data";
import type { GlobeMarker } from "@/components/globe/EarthGlobe";
import { GLOBAL_NEWS, LIVE_SOURCES, LIVE_SOURCES_CHECKED } from "@/lib/live-sources.data";
import { countryDestinations, type Destination } from "@/lib/globe-destinations";
import { fmtDate } from "@/lib/uk-stats";

const EarthGlobe = lazy(() => import("@/components/globe/EarthGlobe"));

export type GlobeState = {
  ind: string; official: boolean; acled: boolean; c: string; riots?: boolean | undefined; protests?: boolean | undefined; m?: string | undefined;
  /** "us" / "uk" colour by that government's travel advice level instead of an indicator. */
  layer?: "us" | "uk" | undefined;
  /** Warning list filters. */
  gov?: "FCDO" | "US" | undefined; age?: 1 | 7 | undefined;
  /** iso3 of the first country picked for comparison. */
  cmp?: string | undefined;
};

/** Shared search-param parsing for every page that hosts the globe. */
export function parseGlobeExtras(s: Record<string, unknown>): Pick<GlobeState, "layer" | "gov" | "age" | "cmp"> {
  const age = Number(s["age"]);
  return {
    layer: s["layer"] === "us" || s["layer"] === "uk" ? s["layer"] : undefined,
    gov: s["gov"] === "FCDO" || s["gov"] === "US" ? s["gov"] : undefined,
    age: age === 1 || age === 7 ? age : undefined,
    cmp: typeof s["cmp"] === "string" && /^[A-Z]{3}$/.test(s["cmp"]) ? s["cmp"] : undefined,
  };
}

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

const CTRL = "inline-flex min-h-9 items-center gap-1 rounded border border-night-line bg-night-panel/90 px-2 py-1 backdrop-blur hover:bg-night disabled:opacity-50";

function Swatch({ c }: { c: string }) { return <span aria-hidden="true" className="mr-1.5 inline-block size-2.5 rounded-sm align-middle" style={{ background: c }} />; }

function AdviceLevels({ warnings, k, fcdo }: { warnings: OfficialWarning[]; k: string; fcdo: Parameters<typeof travelAdviceLevel>[2] }) {
  const a = travelAdviceLevel(warnings, k, fcdo);
  if (!a.us && !a.uk) return null;
  return <ul className="mt-3 space-y-1 text-xs" aria-label="Travel advice levels">
    {a.uk && <li><Swatch c={UK_ALERT_COLOURS[a.uk.status]} /><a className="underline" href={a.uk.url} target="_blank" rel="noreferrer noopener">{a.uk.label}</a> <span className="text-night-muted">· UK FCDO, updated {fmtDate(a.uk.updated)}</span></li>}
    {a.us && <li><Swatch c={US_LEVEL_COLOURS[a.us.level]!} /><a className="underline" href={a.us.url} target="_blank" rel="noreferrer noopener">{a.us.label}</a> <span className="text-night-muted">· US State Dept, updated {fmtDate(a.us.updated)}</span></li>}
  </ul>;
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
  const stat = useMemo(() => (ind && world && !s.layer ? statLayer(world, ind) : null), [ind, world, s.layer]);
  const advice = useMemo(() => {
    if (!s.layer || !unrest) return null;
    const fill = new Map<string, string>(), labels = new Map<string, string>();
    if (s.layer === "us") for (const w of unrest.warnings) { if (w.source === "US State Dept" && w.level) { fill.set(w.key, US_LEVEL_COLOURS[w.level]!); labels.set(w.key, `${w.country}: ${US_LEVEL_LABEL[w.level]} (US State Dept, ${fmtDate(w.updated)})`); } }
    else for (const [k, a] of Object.entries(unrest.fcdoAlerts ?? {})) { fill.set(k, UK_ALERT_COLOURS[a.status]); labels.set(k, `${unrest.warnings.find((w) => w.key === k && w.source === "FCDO")?.country ?? k}: ${FCDO_ALERT_LABEL[a.status]} (FCDO, ${fmtDate(a.updated)})`); }
    return { fill, labels };
  }, [s.layer, unrest]);
  const [rotate, setRotate] = useState<boolean | undefined>(undefined);
  const [resetKey, setResetKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  useEffect(() => { setSheetOpen(false); }, [s.c]);
  const hot = useMemo(() => (unrest && s.official && !s.layer ? unrestHotspots(unrest.warnings, new Date()) : new Map<string, OfficialWarning[]>()), [unrest, s.official, s.layer]);
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
  const listed = filterWarningMarkers(official, { gov: s.gov ?? "all", riots: showRiots, protests: showProtests, days: s.age ?? 30 }, new Date());
  const nextWarning = () => { if (!listed.length) return; const i = listed.findIndex((m) => m.id === s.m); pick(listed[(i + 1) % listed.length]!); };
  const nextCountry = () => { if (!names.length) return; const i = names.findIndex((c) => countryKey(c.name) === s.c); onChange({ c: countryKey(names[(i + 1) % names.length]!.name), m: undefined }); };
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
        {gl && <EarthGlobe shade={null} fill={advice?.fill ?? stat?.fill ?? null} labels={advice?.labels ?? stat?.labels ?? null} rotate={rotate} resetKey={resetKey} hotspots={hotKeys} events={research.length ? [] : events} selected={sel} onSelect={(k) => onChange({ c: k, m: undefined })} markers={markers} onMarker={(id) => { const m = official.find((x) => x.id === id); if (m) pick(m); }} focus={marker ? { lat: marker.lat, lng: marker.lng } : null} />}
      </Suspense></ClientOnly>}
      <div className="absolute inset-x-3 top-3 z-10 flex items-start gap-2 text-xs sm:right-auto sm:w-80">
        <div className="flex min-w-0 flex-1 items-center gap-1 rounded-md border border-night-line bg-night-panel/90 p-1.5 backdrop-blur">
        {compact ? <h2 className="sr-only">Explore the world — click any country</h2> : <h1 className="sr-only">World globe</h1>}
        <form onSubmit={find} role="search" className="flex min-w-0 flex-1 gap-1">
          <label htmlFor={compact ? "globe-q-home" : "globe-q"} className="sr-only">Find a country</label>
          <div className="relative flex-1"><Search aria-hidden="true" className="absolute left-2 top-2 size-3.5 text-night-muted" />
            <input id={compact ? "globe-q-home" : "globe-q"} list="globe-country-names" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a country…" className="w-full rounded border border-night-line bg-night py-1.5 pr-2 pl-7" />
          </div>
          <Button type="submit" size="sm">Go</Button>
          <datalist id="globe-country-names">{names.map((c) => <option key={c.iso3} value={c.name} />)}</datalist>
        </form>
          <button type="button" onClick={() => setLayersOpen((o) => !o)} aria-expanded={layersOpen} aria-controls="globe-layers" className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded border border-night-line px-2 hover:bg-night"><Layers className="size-3.5" />Layers</button>
        </div>
      </div>
      {layersOpen && <div id="globe-layers" role="dialog" aria-label="Globe layers" onKeyDown={(e) => { if (e.key === "Escape") setLayersOpen(false); }} className="z-40 overflow-y-auto border border-night-line bg-night-panel p-3 text-xs shadow-2xl max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[55dvh] max-sm:rounded-t-xl sm:absolute sm:left-3 sm:top-16 sm:max-h-[70%] sm:w-80 sm:rounded-md sm:bg-night-panel/95 sm:backdrop-blur">
        <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Layers</h2><Button variant="ghost" size="icon" aria-label="Close layers" onClick={() => setLayersOpen(false)}><X className="size-4" /></Button></div>
        <label className="mt-2 block">Colour by
          <select value={s.layer ? `@${s.layer}` : s.ind} onChange={(e) => { const v = e.target.value; setLayersOpen(false); onChange(v === "@us" || v === "@uk" ? { layer: v.slice(1) as "us" | "uk" } : { layer: undefined, ind: v }); }} className="ml-2 max-w-[60%] rounded border border-night-line bg-night px-2 py-1">
            <option value="none">Nothing</option>
            <optgroup label="Travel advice level"><option value="@us">US State Dept level (1–4)</option><option value="@uk">UK FCDO advice against travel</option></optgroup>
            {WORLD_INDICATORS.map((i) => <option key={i.slug} value={i.slug}>{i.label}</option>)}
          </select>
        </label>
        {stat && ind && <div className="mt-2" aria-label="Colour key">
          <div className="h-2 rounded" style={{ background: `linear-gradient(to right, ${shadeColour(0)}, ${shadeColour(0.5)}, ${shadeColour(1)})` }} />
          <div className="mt-0.5 flex justify-between font-mono text-[10px] text-night-muted"><span>Rank {stat.ranked}</span><span>Rank 1</span></div>
          <p className="mt-1 text-night-muted"><Swatch c={NO_FIGURE} /> no figure within {MAX_LAG_YEARS} years. Newest year {stat.newest ?? "—"}; {stat.ranked} ranked. Hover a country for its figure. Source: {WORLD_SOURCE.name}.</p>
        </div>}
        {s.layer === "us" && <ul className="mt-2 space-y-0.5 text-night-muted" aria-label="Colour key">{[1, 2, 3, 4].map((l) => <li key={l}><Swatch c={US_LEVEL_COLOURS[l]!} />{US_LEVEL_LABEL[l]}</li>)}<li><Swatch c={NO_FIGURE} />No US advisory on file</li><li>Source: US State Department, its own levels.</li></ul>}
        {s.layer === "uk" && <ul className="mt-2 space-y-0.5 text-night-muted" aria-label="Colour key">{(["all", "all-but-essential", "parts-all", "parts-essential", "none"] as FcdoAlert[]).map((a) => <li key={a}><Swatch c={UK_ALERT_COLOURS[a]} />{FCDO_ALERT_LABEL[a]}</li>)}<li><Swatch c={NO_FIGURE} />Not yet checked</li><li>Source: UK FCDO, its own statements. {Object.keys(unrest?.fcdoAlerts ?? {}).length} of {(unrest?.warnings ?? []).filter((w) => w.source === "FCDO").length} countries checked so far — pages are read in batches every 15 minutes.</li></ul>}
        {s.layer && <p className="mt-1 text-night-muted">The two governments use different scales, so they are never merged.</p>}
        <label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={s.official} onChange={(e) => onChange({ official: e.target.checked })} /> <span><b className="text-overdue">Red</b>: official warnings mentioning unrest (30 days)</span></label>
        <label className="mt-1 flex items-center gap-2"><input type="checkbox" checked={s.acled} onChange={(e) => onChange({ acled: e.target.checked })} /> <span><b className="text-ageing">Dots</b>: ACLED research — {unrest?.acled.connected ? (unrest.acled.error ?? `${events.length} events, 30 days`) : (unrest?.acled.error ?? "Not connected")}</span></label>
        <div className="mt-2 flex gap-3">
          <label className="flex items-center gap-1"><input type="checkbox" checked={showRiots} onChange={(e) => onChange({ riots: e.target.checked })} /> Riots</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={showProtests} onChange={(e) => onChange({ protests: e.target.checked })} /> Protests</label>
        </div>
        {compact && <Link to="/globe" search={{ ...s, layer: s.layer, gov: s.gov, age: s.age, cmp: s.cmp }} className="mt-2 inline-flex items-center gap-1 text-electric-soft underline"><Maximize2 className="size-3" />Open full-screen globe</Link>}
      </div>}
      {(stat && ind || s.layer) && !layersOpen && <div aria-label="Colour key" className="absolute right-3 bottom-14 z-10 max-w-[60%] rounded-md border border-night-line bg-night-panel/90 p-2 text-[10px] backdrop-blur sm:top-3 sm:bottom-auto sm:max-w-56">
        {stat && ind ? <><p className="truncate font-semibold">{ind.label} · {stat.newest ?? "—"}</p><div className="mt-1 h-1.5 rounded" style={{ background: `linear-gradient(to right, ${shadeColour(0)}, ${shadeColour(0.5)}, ${shadeColour(1)})` }} /><div className="flex justify-between font-mono text-night-muted"><span>Low rank</span><span>Rank 1</span></div></>
          : s.layer === "us" ? <ul>{[1, 2, 3, 4].map((l) => <li key={l}><Swatch c={US_LEVEL_COLOURS[l]!} />Level {l}</li>)}<li className="text-night-muted">US State Dept</li></ul>
          : <ul>{(["all", "all-but-essential", "parts-all", "parts-essential", "none"] as FcdoAlert[]).map((a) => <li key={a} className="truncate"><Swatch c={UK_ALERT_COLOURS[a]} />{FCDO_ALERT_LABEL[a].replace("FCDO advises against ", "Against ")}</li>)}<li className="text-night-muted">UK FCDO</li></ul>}
      </div>}
      {gl && <div aria-label="Globe controls" className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1 text-xs">
        <button onClick={nextWarning} disabled={!listed.length} aria-label="Next warning" className={CTRL}><SkipForward className="size-3.5" /><span className="max-sm:sr-only">Next warning</span></button>
        <button onClick={nextCountry} aria-label="Next country" className={CTRL}><SkipForward className="size-3.5" /><span className="max-sm:sr-only">Next country</span></button>
        <button onClick={() => setRotate((r) => !r)} aria-pressed={!!rotate} aria-label={rotate ? "Stop spin" : "Spin"} className={CTRL}>{rotate ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}<span className="max-sm:sr-only">{rotate ? "Stop spin" : "Spin"}</span></button>
        <button onClick={() => { setResetKey((k) => k + 1); onChange({ c: "", m: undefined }); }} aria-label="Reset view" className={CTRL}><RotateCcw className="size-3.5" /><span className="max-sm:sr-only">Reset view</span></button>
      </div>}
    </section>

    <aside aria-label="Country controls" className={`w-full overflow-y-auto border-t border-night-line bg-night-panel p-4 lg:w-[380px] lg:border-l lg:border-t-0 ${compact ? "max-h-[620px]" : "lg:max-h-[calc(100dvh-64px)]"} ${!compact && sel ? `max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-30 max-lg:rounded-t-xl max-lg:border max-lg:shadow-2xl ${sheetOpen ? "max-lg:max-h-[60dvh]" : "max-lg:max-h-16 max-lg:overflow-hidden"}` : ""}`}>
      {!compact && sel && <button onClick={() => setSheetOpen((o) => !o)} aria-expanded={sheetOpen} className="mx-auto -mt-2 mb-2 flex min-h-8 w-full items-center justify-center gap-1 text-xs text-night-muted lg:hidden"><span className="h-1 w-10 rounded bg-night-line" /><b className="text-night-fg">{selName}</b> · {sheetOpen ? "Lower panel" : "Raise panel"}<ChevronDown className={`size-3.5 ${sheetOpen ? "" : "rotate-180"}`} /></button>}
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
        {stat && ind && <p className="mt-2 font-mono text-xs">{(() => { const r = stat.rank.get(sel); return r ? `${ind.label}: ${r.value} · rank ${r.rank} of ${r.of} (${r.year})` : `${ind.label}: no rankable figure`; })()}</p>}
        <AdviceLevels warnings={unrest?.warnings ?? []} k={sel} fcdo={unrest?.fcdoAlerts} />
        {wb && <div className="mt-3 rounded border border-night-line p-2 text-sm">{s.cmp && s.cmp !== wb.iso3
          ? <div className="flex flex-wrap items-center gap-2"><Link to="/world-compare" search={{ countries: `${s.cmp},${wb.iso3}` }} className="inline-flex items-center gap-1 font-semibold text-electric-soft underline">Compare {names.find((c) => c.iso3 === s.cmp)?.name ?? s.cmp} with {wb.name}<ArrowRight className="size-3.5" /></Link><button className="text-xs underline" onClick={() => onChange({ cmp: undefined })}>Clear</button></div>
          : s.cmp === wb.iso3 ? <p className="text-xs text-night-muted">Picked for comparison — now click a second country. <button className="underline" onClick={() => onChange({ cmp: undefined })}>Cancel</button></p>
          : <button onClick={() => onChange({ cmp: wb.iso3 })} className="text-left underline">Compare {wb.name} with another country</button>}</div>}
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
        <h3 className="mt-5 font-semibold">Official riot and protest warnings</h3>
        <div className="mt-2 flex flex-wrap gap-1 text-xs" role="group" aria-label="Filter warnings">
          {([["all", "Both governments"], ["FCDO", "UK FCDO"], ["US", "US State Dept"]] as const).map(([v, l]) => <button key={v} aria-pressed={(s.gov ?? "all") === v} onClick={() => onChange({ gov: v === "all" ? undefined : v })} className={`rounded border px-2 py-1 ${(s.gov ?? "all") === v ? "border-electric" : "border-night-line"}`}>{l}</button>)}
          {([[1, "24h"], [7, "7 days"], [30, "30 days"]] as const).map(([v, l]) => <button key={v} aria-pressed={(s.age ?? 30) === v} onClick={() => onChange({ age: v === 30 ? undefined : v })} className={`rounded border px-2 py-1 ${(s.age ?? 30) === v ? "border-electric" : "border-night-line"}`}>{l}</button>)}
        </div>
        <p className="mt-1 text-[11px] text-night-muted">Riot/protest switches on the globe also filter this list.</p>
        {listed.length ? <ul className="mt-2 space-y-1 text-sm">{listed.map((m) => <li key={m.id}><button onClick={() => pick(m)} className="w-full rounded border border-night-line px-3 py-2 text-left hover:bg-night">
          <b className={m.kind === "riot" ? "text-overdue" : "text-ageing"}>{m.kind === "riot" ? "Riot" : "Protest"}</b> · <b>{m.country}</b>{m.unspecified ? "" : ` — ${m.place}`}
          <span className="block text-xs text-night-muted">{m.warning.source} · {fmtStamp(m.warning.updated)}</span></button></li>)}</ul>
          : <p className="mt-2 text-sm text-night-muted">{!unrest ? "Waiting for the official feeds." : !s.official ? "Official layer is switched off." : "No matching warnings in this period."}</p>}
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
