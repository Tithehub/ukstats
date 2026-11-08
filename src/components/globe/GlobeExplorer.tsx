import { LIVE_STREAM_URL } from "@/lib/brand";
import { ClientOnly, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ExternalLink, Info, Maximize2, Pause, Play, RotateCcw, Search, SkipForward, Layers, Landmark, Tv, Radio, X, ChevronDown, Plane as PlaneIcon, Video, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { worldQuery } from "@/lib/world.functions";
import { unrestQuery } from "@/lib/unrest.functions";
import { TOP_FIVE, WORLD_INDICATORS, WORLD_SOURCE, MAX_LAG_YEARS, fmtWorld } from "@/lib/world";
import { countryKey, filterWarningMarkers, travelAdviceLevel, unrestHotspots, unrestMarkers, warningAge, FCDO_ALERT_LABEL, US_LEVEL_LABEL, KIND_LABEL, isMilitary, type UnrestKind, type FcdoAlert, type OfficialWarning, type UnrestMarker } from "@/lib/unrest";
import { statLayer, shadeColour, NO_FIGURE, UK_ALERT_COLOURS, US_LEVEL_COLOURS } from "@/lib/globe-legend";
import { UNREST_PLACES } from "@/lib/unrest-places.data";
import type { GlobeMarker } from "@/components/globe/EarthGlobe";
import { GLOBAL_NEWS, LIVE_SOURCES, LIVE_SOURCES_CHECKED } from "@/lib/live-sources.data";
import { BROADCAST_CHANNELS, BROADCAST_CHECKED, type BroadcastChannel, type BroadcastKind } from "@/lib/broadcast-channels.data";
import { countryDestinations, type Destination } from "@/lib/globe-destinations";
import { fmtDate } from "@/lib/uk-stats";
import { videoFeedQuery } from "@/lib/video-feed.functions";
import { feedPins as feedPinMap, type FeedAge } from "@/lib/video-feed";
import { LiveFeed } from "@/components/globe/LiveFeed";
import { BroadcastPanel } from "@/components/globe/BroadcastPanel";
import { NewsScreens, type BulletinData } from "@/components/globe/NewsScreens";
import { GlobeShare } from "@/components/globe/GlobeShare";
import { flightsQuery } from "@/lib/flights.functions";
import { flightStatus, projectAhead, SQUAWK_MEANING, type AreaAdvice } from "@/lib/flights";
import { newsReportsQuery } from "@/lib/news-reports.functions";
import type { ReportItem } from "@/lib/news-reports";
import { migrationFlowsQuery } from "@/lib/migration-flows.functions";
import { smallBoatsQuery } from "@/lib/small-boats.functions";
import { boatHistory, buildFlows, MIGRATION_SOURCES } from "@/lib/migration-flows";
import { SMALL_BOATS_SOURCE } from "@/lib/small-boats";
import { buildRunningOrder, nextInOrder, UK_KEY } from "@/lib/globe-broadcast";
import { GlobeKey } from "@/components/globe/GlobeKey";
import { quakesQuery, tlesQuery } from "@/lib/earth-watch.functions";
import { QUAKE_SOURCE } from "@/lib/quakes";
import { publicCamsQuery } from "@/lib/public-cams.functions";
import { CamList, CamViewer } from "./CamViewer";
import { SAT_SOURCE } from "@/lib/satellites";
import { useSatPositions } from "@/components/globe/useSatPositions";
import { GlobeHud } from "@/components/globe/GlobeHud";

const loadEarthGlobe = () => import("@/components/globe/EarthGlobe");
const EarthGlobe = lazy(loadEarthGlobe);

export type GlobeState = {
  ind: string; official: boolean; acled: boolean; c: string; riots?: boolean | undefined; protests?: boolean | undefined; mil?: boolean | undefined; m?: string | undefined;
  /** "us" / "uk" colour by that government's travel advice level instead of an indicator. */
  layer?: "us" | "uk" | undefined;
  /** Warning list filters. */
  gov?: "FCDO" | "US" | undefined; age?: 1 | 7 | undefined;
  /** iso3 of the first country picked for comparison. */
  cmp?: string | undefined;
  /** Side-panel tab ("live" = live video feed) and its filters. */
  feed?: "live" | undefined; fk?: BroadcastKind | undefined; fa?: FeedAge | undefined;
  /** Flights layer on, and the selected aircraft (hex id). */
  fl?: boolean | undefined; fp?: string | undefined;
  /** Migration layer: small boats in the Channel plus official irregular-migration and refugee arrows. */
  mg?: boolean | undefined;
  /** News & police reports layer: protests, riots and plane incidents (headlines verbatim, labelled as media). */
  nw?: boolean | undefined;
  /** Earthquakes (USGS) and satellites (CelesTrak) layers. */
  eq?: boolean | undefined; st?: boolean | undefined; cam?: boolean | undefined; dn?: false | undefined;
};

/** Shared search-param parsing for every page that hosts the globe. */
export function parseGlobeExtras(s: Record<string, unknown>): Pick<GlobeState, "layer" | "gov" | "age" | "cmp" | "feed" | "fk" | "fa" | "fl" | "fp" | "mg" | "nw" | "eq" | "st" | "cam" | "dn"> {
  const age = Number(s["age"]), fa = Number(s["fa"]);
  return {
    layer: s["layer"] === "us" || s["layer"] === "uk" ? s["layer"] : undefined,
    gov: s["gov"] === "FCDO" || s["gov"] === "US" ? s["gov"] : undefined,
    age: age === 1 || age === 7 ? age : undefined,
    feed: s["feed"] === "live" ? "live" : undefined,
    fk: s["fk"] === "official" || s["fk"] === "msm" || s["fk"] === "alt" ? s["fk"] : undefined,
    fa: fa === 1 || fa === 6 ? fa : undefined,
    fl: s["fl"] === true || s["fl"] === "1" || s["fl"] === "true" ? true : undefined,
    mg: s["mg"] === true || s["mg"] === "1" || s["mg"] === "true" ? true : undefined,
    eq: s["eq"] === true || s["eq"] === "1" || s["eq"] === "true" ? true : undefined,
    st: s["st"] === true || s["st"] === "1" || s["st"] === "true" ? true : undefined,
    dn: s["dn"] === false || s["dn"] === "0" || s["dn"] === "false" ? false : undefined,
    cam: s["cam"] === true || s["cam"] === "1" || s["cam"] === "true" ? true : undefined,
    nw: s["nw"] === true || s["nw"] === "1" || s["nw"] === "true" ? true : undefined,
    fp: typeof s["fp"] === "string" && /^[0-9a-z~]{4,8}$/i.test(s["fp"]) ? s["fp"] : undefined,
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

const TB = "inline-flex min-h-8 shrink-0 items-center gap-1 rounded border border-night-line px-2 hover:bg-night";
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

const KIND_META: Record<BroadcastKind, { label: string; note: string; Icon: typeof Tv; cls: string }> = {
  official: { label: "Official — government", note: "Government bodies' own channels", Icon: Landmark, cls: "text-fresh" },
  msm: { label: "MSM — mainstream media", note: "Not official", Icon: Tv, cls: "text-electric-soft" },
  alt: { label: "Alternative media", note: "Not official; independent outlets", Icon: Radio, cls: "text-ageing" },
};
const fmtSubs = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}m` : `${Math.round(n / 1e3)}k`);

function ChannelRow({ c }: { c: BroadcastChannel }) {
  return <li><a href={`https://www.youtube.com/channel/${c.channelId}`} target="_blank" rel="noreferrer noopener" className="flex min-h-11 items-center gap-2 rounded border border-night-line px-2 py-1.5 hover:bg-night">
    <img src={c.avatar} alt="" width={32} height={32} loading="lazy" referrerPolicy="no-referrer" className="size-8 shrink-0 rounded-full bg-night" />
    <span className="min-w-0 flex-1"><span className="block truncate text-sm">{c.name}</span><span className="block truncate font-mono text-[10px] text-night-muted">YouTube {c.handle} · {fmtSubs(c.subscribers)} subscribers{c.state ? " · state-owned" : ""}</span></span>
    <ExternalLink className="size-3 shrink-0 text-night-muted" aria-hidden="true" />
  </a></li>;
}

/** Verified YouTube channels for one country, grouped and labelled so only government channels read as official. */
function BroadcastChannels({ k, limit }: { k: string; limit?: number }) {
  const list = BROADCAST_CHANNELS[k];
  if (!list?.length) return <p className="mt-1 text-sm text-night-muted">No verified broadcast channels listed for this country yet.</p>;
  return <div className="mt-2 space-y-3">
    {(["official", "msm", "alt"] as const).map((kind) => {
      const rows = list.filter((c) => c.kind === kind).slice(0, limit);
      if (!rows.length) return null;
      const m = KIND_META[kind];
      return <div key={kind}><p className={`flex flex-wrap items-center gap-x-1 font-mono text-[11px] uppercase ${m.cls}`}><m.Icon className="size-3.5" aria-hidden="true" />{m.label} <span className="normal-case text-night-muted">· {m.note}</span></p>
        <ul className="mt-1 space-y-1">{rows.map((c) => <ChannelRow key={c.channelId} c={c} />)}</ul></div>;
    })}
    <p className="text-[11px] text-night-muted">YouTube-verified channels; subscriber counts as reported by YouTube on {fmtDate(BROADCAST_CHECKED)}. Media channels are not official sources.</p>
  </div>;
}

function hasWebGL() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}

/** The globe plus its control panel, shared by the home page and /globe. */
export function GlobeExplorer({ state: s, onChange, compact = false, broadcast = false }: { state: GlobeState; onChange: (p: Partial<GlobeState>) => void; compact?: boolean; broadcast?: boolean }) {
  const { data: world } = useQuery(worldQuery());
  const { data: unrest } = useQuery({ ...unrestQuery(), refetchInterval: 5 * 60_000 });
  const [feedPaused, setFeedPaused] = useState(false);
  const { data: feed } = useQuery(videoFeedQuery(feedPaused));
  const { data: flights } = useQuery(flightsQuery(!!s.fl));
  const { data: migration } = useQuery(migrationFlowsQuery(!!s.mg));
  const { data: reports } = useQuery(newsReportsQuery(!!s.nw));
  const { data: quakeData } = useQuery(quakesQuery(!!s.eq));
  const { data: tleData } = useQuery(tlesQuery(!!s.st));
  const globeQuakes = useMemo(() => (s.eq && quakeData ? quakeData.items.map((q) => ({ id: q.id, lat: q.lat, lng: q.lng, mag: q.mag, label: `Magnitude ${q.mag.toFixed(1)} — ${q.place}, ${fmtStamp(q.time)}, depth ${Math.round(q.depthKm)} km${q.tsunami ? " · tsunami flag" : ""} (USGS)` })) : []), [s.eq, quakeData]);
  const { data: camData } = useQuery(publicCamsQuery(!!s.cam));
  const [camId, setCamId] = useState<string | null>(null);
  const globeCams = useMemo(() => (s.cam && camData ? camData.items : []), [s.cam, camData]);
  useEffect(() => { if (camId && !broadcast) setOnAir(false); }, [camId, broadcast]);
  const cam = camId ? globeCams.find((c) => c.id === camId) ?? null : null;
  const globeSats = useSatPositions(s.st ? tleData?.items ?? null : null);
  const [preset, setPreset] = useState<{ n: number; kind: "world" | "tilt" | "focus" | "in" | "out" } | null>(null);
  const [tele, setTele] = useState<{ lat: number | null; lng: number | null; altKm: number }>({ lat: null, lng: null, altKm: 12000 });
  const { data: boatsData } = useQuery({ ...smallBoatsQuery(), enabled: !!s.mg || s.c === UK_KEY });
  const latestBoatDay = useMemo(() => { const d = boatsData?.days ?? boatsData?.series ?? []; return d.length ? d[d.length - 1]! : null; }, [boatsData]);
  const boatYear = useMemo(() => { if (!latestBoatDay) return null; const y = latestBoatDay.date.slice(0, 4); return (boatsData?.days ?? boatsData?.series ?? []).filter((d) => d.date.startsWith(y)).reduce((a, d) => ({ arrivals: a.arrivals + d.arrivals, boats: a.boats + d.boats }), { arrivals: 0, boats: 0 }); }, [boatsData, latestBoatDay]);
  const globeBoats = useMemo(() => { if (!s.mg) return []; const d = boatsData?.days ?? boatsData?.series ?? []; const byDay = new Map(d.map((x) => [x.date, x])); return boatHistory(d).map((b) => { const day = byDay.get(b.date)!; return { id: b.id, lat: b.lat, lng: b.lng, color: b.color, label: `Small boat detected crossing the Channel on ${fmtDate(b.date)}${b.ageDays === 0 ? " (latest day)" : ` — ${b.ageDays} days before the latest report`}: ${day.boats} boats, ${day.arrivals.toLocaleString("en-GB")} people that day (Home Office). Position illustrative.` }; }); }, [s.mg, boatsData]);
  const flowRows = useMemo(() => (s.mg && migration ? buildFlows(migration) : []), [s.mg, migration]);
  const globeFlows = useMemo(() => { const max = Math.max(1, ...flowRows.map((f) => f.value)); const col = { frontex: "#f0a020", cbp: "#ff4a3a", unhcr: "#7fb2ff" } as const; return flowRows.map((f, i) => ({ id: `mf-${i}`, from: f.from, to: f.to, toLat: f.toLat, toLng: f.toLng, color: col[f.source], stroke: 0.15 + 0.85 * Math.sqrt(f.value / max), label: f.label })); }, [flowRows]);
  const [gl, setGl] = useState<boolean | null>(null);
  const [q, setQ] = useState("");
  // Load the 3D module before switching it on, so the swap never suspends inside a pending navigation and leaves the globe blank.
  useEffect(() => { const g = hasWebGL(); if (!g) { setGl(false); return; } let live = true; void loadEarthGlobe().then(() => { if (live) setGl(true); }, () => { if (live) setGl(false); }); return () => { live = false; }; }, []);

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
  const [rotate, setRotate] = useState<boolean | undefined>(broadcast ? true : undefined);
  const [resetKey, setResetKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  // One overlay at a time, so panels never pile up over the globe.
  const [panel, setPanel] = useState<"search" | "layers" | "cams" | "key" | null>(null);
  const layersOpen = panel === "layers", keyOpen = panel === "key";
  const setLayersOpen = (o: boolean | ((v: boolean) => boolean)) => setPanel((p) => ((typeof o === "function" ? o(p === "layers") : o) ? "layers" : p === "layers" ? null : p));
  const setKeyOpen = (o: boolean | ((v: boolean) => boolean)) => setPanel((p) => ((typeof o === "function" ? o(p === "key") : o) ? "key" : p === "key" ? null : p));
  const openPanel = (k: "search" | "layers" | "cams" | "key") => { setSheetOpen(false); setPanel((p) => (p === k ? null : k)); };
  useEffect(() => { setSheetOpen(false); if (panel === "search") setPanel(null); }, [s.c]);
  useEffect(() => { if (sheetOpen) setPanel(null); }, [sheetOpen]);
  const hot = useMemo(() => (unrest && s.official && !s.layer ? unrestHotspots(unrest.warnings, new Date()) : new Map<string, OfficialWarning[]>()), [unrest, s.official, s.layer]);
  const hotKeys = useMemo(() => new Set(hot.keys()), [hot]);
  const events = s.acled && unrest?.acled.connected ? unrest.acled.events : [];
  const showRiots = s.riots !== false, showProtests = s.protests !== false, showMil = s.mil !== false;
  const shows = (k: UnrestKind) => (isMilitary(k) ? showMil : k === "riot" ? showRiots : showProtests);
  const official = useMemo(() => (unrest && s.official ? unrestMarkers(unrest.warnings, new Date(), UNREST_PLACES) : []), [unrest, s.official]);
  const visible = official.filter((m) => shows(m.kind));
  const research: GlobeMarker[] = events.flatMap((e) => {
    const k: UnrestKind | null = /explosion|remote violence|air|drone|shelling|missile/i.test(`${e.type} ${e.subType}`) ? "strike" : /battle/i.test(e.type) ? "war" : /riot/i.test(e.type) ? "riot" : /protest/i.test(e.type) ? "protest" : null;
    if (!k || !shows(k)) return [];
    return [{ id: `acled|${e.id}`, kind: k, lat: e.lat, lng: e.lng, label: `${e.subType || e.type} — ${e.location}, ${e.date} (ACLED research, not official)`, research: true }];
  }).slice(0, 150);
  const markers: GlobeMarker[] = [...visible.map((m) => ({ id: m.id, kind: m.kind, lat: m.lat, lng: m.lng, label: `${KIND_LABEL[m.kind]} warning — ${m.place}, ${m.country} (${m.warning.source})` })), ...research,
    ...(s.nw ? (reports?.items ?? []).flatMap((r): GlobeMarker[] => r.lat !== null && r.lng !== null && r.kind !== "aviation" && shows(r.kind) ? [{ id: `news|${r.id}`, kind: r.kind, lat: r.lat, lng: r.lng, label: `${r.title} — ${r.publisher}, ${fmtStamp(r.published)} (${r.official ? "police notice" : "news report, not official"})`, research: true }] : []) : [])];
  const listed = filterWarningMarkers(official, { gov: s.gov ?? "all", riots: showRiots, protests: showProtests, military: showMil, days: s.age ?? 30 }, new Date());
  const nextWarning = () => { if (!listed.length) return; const i = listed.findIndex((m) => m.id === s.m); pick(listed[(i + 1) % listed.length]!); };
  const nextCountry = () => { if (!names.length) return; const i = names.findIndex((c) => countryKey(c.name) === s.c); onChange({ c: countryKey(names[(i + 1) % names.length]!.name), m: undefined }); };
  const capitals = useMemo(() => { const m = new Map<string, [number, number]>(); for (const p of UNREST_PLACES) if (p[4]) m.set(countryKey(p[0]), [p[2], p[3]]); return m; }, []);
  const pins = useMemo(() => feed ? [...feedPinMap(feed.items, new Date()).entries()].flatMap(([k, p]) => { const c = capitals.get(k); return c ? [{ key: k, lat: c[0] - 1.5, lng: c[1] + 1.5, ...p, label: `${p.live ? "Live broadcast · " : ""}${p.count} news video${p.count === 1 ? "" : "s"} in 6h — ${k} (media, not official)` }] : []; }) : [], [feed, capitals]);
  const marker: UnrestMarker | undefined = s.m ? official.find((m) => m.id === s.m) : undefined;
  const pick = (m: UnrestMarker) => onChange({ c: m.key, m: m.id });

  const sel = s.c || null;
  const wb = sel ? byKey.get(sel) : undefined;
  const warnings = sel ? (unrest?.warnings ?? []).filter((w) => w.key === sel) : [];
  const live = sel ? LIVE_SOURCES[sel] : undefined;
  const selName = (wb?.name ?? warnings[0]?.country ?? sel)?.replace(/(^|[\s-])(\p{Ll})/gu, (_m, a: string, b: string) => a + b.toUpperCase());
  const dests = sel ? countryDestinations(wb?.iso2 ?? (sel === "united kingdom" ? "GB" : ""), wb?.iso3 ?? null, selName ?? "") : [];
  // The automatic country tour is opt-in, so the globe stays where you put it.
  const [onAir, setOnAir] = useState(broadcast);
  const order = useMemo(() => buildRunningOrder(names.map((c) => countryKey(c.name)), unrest?.warnings ?? []), [names, unrest]);
  const goNext = useCallback(() => { const n = nextInOrder(order, s.c || UK_KEY); if (n) onChange({ c: n, m: undefined }); }, [order, s.c, onChange]);
  const goPrev = useCallback(() => { const n = nextInOrder(order, s.c || UK_KEY, -1); if (n) onChange({ c: n, m: undefined }); }, [order, s.c, onChange]);
  const bulletinStats = wb ? WORLD_INDICATORS.slice(0, 6).flatMap((i) => { const v = world?.values[i.id]?.[wb.iso3]; return v ? [{ label: i.label, value: `${fmtWorld(v.value, i.unit)} (${v.year})` }] : []; }) : [];
  const countryVideos = sel && feed?.connected ? feed.items.filter((v) => v.country === sel) : [];
  const bulletinFor = useCallback((k: string): BulletinData => {
    const b = byKey.get(k); const ws = (unrest?.warnings ?? []).filter((w) => w.key === k);
    return { name: b?.name ?? ws[0]?.country ?? k, statSource: b ? WORLD_SOURCE : null, warnings: ws,
      stats: b ? WORLD_INDICATORS.slice(0, 6).flatMap((i) => { const v = world?.values[i.id]?.[b.iso3]; return v ? [{ label: i.label, value: `${fmtWorld(v.value, i.unit)} (${v.year})` }] : []; }) : [],
      videos: feed?.connected ? feed.items.filter((v) => v.country === k) : [] };
  }, [byKey, unrest, world, feed]);
  const stepCountry = useCallback((k: string, dir: 1 | -1) => nextInOrder(order, k, dir), [order]);
  const screenCountries = useMemo(() => names.map((c) => ({ key: countryKey(c.name), name: c.name })), [names]);
  const areaAdvice = useMemo(() => {
    const m = new Map<string, AreaAdvice>();
    for (const w of unrest?.warnings ?? []) if (w.source === "US State Dept" && w.level) m.set(w.key, { ...m.get(w.key), us: w.level });
    for (const [k, a] of Object.entries(unrest?.fcdoAlerts ?? {})) m.set(k, { ...m.get(k), uk: a.status });
    return m;
  }, [unrest]);
  const trails = useRef(new Map<string, [number, number][]>());
  const planeRows = useMemo(() => {
    if (!s.fl || !flights?.planes.length) return [];
    const t = trails.current, seen = new Set<string>();
    const rows = flights.planes.map((p) => {
      seen.add(p[0]);
      const tr = t.get(p[0]) ?? []; const last = tr[tr.length - 1];
      if (!last || last[0] !== p[2] || last[1] !== p[3]) { tr.push([p[2], p[3]]); if (tr.length > 15) tr.shift(); t.set(p[0], tr); }
      const st = flightStatus(p[7], p[8] ? areaAdvice.get(p[8]) : undefined);
      return { p, ...st };
    });
    for (const k of t.keys()) if (!seen.has(k)) t.delete(k);
    return rows;
  }, [s.fl, flights, areaAdvice]);
  const globePlanes = useMemo(() => planeRows.map(({ p, status }) => ({ id: p[0], lat: p[2], lng: p[3], status, label: `${p[1] || p[0]} · ${status === "red" ? "Red" : status === "amber" ? "Amber" : "Green"}${p[7] && SQUAWK_MEANING[p[7]] ? ` · ${SQUAWK_MEANING[p[7]]}` : ""}` })), [planeRows]);
  const plane = s.fp ? planeRows.find((r) => r.p[0] === s.fp) ?? null : null;
  const planePaths = useMemo(() => {
    if (!plane) return [];
    const c = plane.status === "red" ? "#ff4a3a" : plane.status === "amber" ? "#f0a020" : "#3fcf7a";
    const [, , lat, lng, , gs, tr] = plane.p;
    const out: { pts: [number, number][]; ahead: boolean; color: string }[] = [];
    const trail = trails.current.get(plane.p[0]) ?? [];
    if (trail.length > 1) out.push({ pts: trail, ahead: false, color: c });
    if (tr !== null) out.push({ pts: [[lat, lng], projectAhead(lat, lng, tr, Math.max(150, (gs ?? 400) * 1.852 * 0.5))], ahead: true, color: c });
    return out;
  }, [plane]);
  const emergencies = planeRows.filter((r) => r.p[7] && SQUAWK_MEANING[r.p[7]]);
  const planeAdvice = plane?.p[8] ? travelAdviceLevel(unrest?.warnings ?? [], plane.p[8], unrest?.fcdoAlerts) : null;
  const headlines = [...official.slice(0, 8).map((m) => ({ id: m.id, text: `${KIND_LABEL[m.kind]} warning — ${m.country} (${m.warning.source}, ${fmtStamp(m.warning.updated)})`, go: () => pick(m) })),
    ...emergencies.slice(0, 6).map((r) => ({ id: `fl-${r.p[0]}`, text: `Aircraft ${SQUAWK_MEANING[r.p[7]!]} — ${r.p[1] || r.p[0]}${r.p[8] ? `, over ${r.p[8].replace(/\b\w/g, (x) => x.toUpperCase())}` : ""} (${fmtStamp(new Date(r.p[10] * 1000).toISOString())})`, go: () => onChange({ fp: r.p[0] }) })),
    ...(feed?.connected ? feed.items.slice(0, 8).map((v) => ({ id: v.id, text: `${v.channel}: ${v.title}`, go: () => onChange({ c: v.country, m: undefined }) })) : [])];
  const hotList = [...hot.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const find = (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim().toLowerCase();
    if (!t) return;
    const m = names.find((c) => c.name.toLowerCase() === t) ?? names.find((c) => c.name.toLowerCase().startsWith(t)) ?? names.find((c) => c.name.toLowerCase().includes(t));
    if (m) { onChange({ c: countryKey(m.name) }); setQ(""); }
  };

  const loading = <div role="status" className="flex h-full flex-col items-center justify-center gap-3 text-sm text-night-muted"><span aria-hidden="true" className="size-10 animate-spin rounded-full border-2 border-night-line border-t-electric" />Loading globe…</div>;
  const height = broadcast ? "h-full" : compact ? "h-[52vh] min-h-[340px] max-h-[620px]" : "h-[60vh] min-h-[380px] lg:h-auto";

  const ticker = <div aria-label="Latest official riot and protest warnings" className="flex items-center gap-2 overflow-x-auto border-b border-night-line bg-night-panel px-3 py-2 text-xs text-night-fg">
    <span className="shrink-0 font-mono uppercase text-overdue"><span className="mr-1 inline-block size-1.5 rounded-full bg-overdue pulse-dot" />Official warnings</span>
    {!unrest ? <span className="text-night-muted">Checking official feeds…</span> : !s.official ? <span className="text-night-muted">Official layer switched off.</span> : official.length === 0 ? <span className="text-night-muted">No riot or protest wording in official advice in the last 30 days.</span> :
      official.slice(0, 12).map((m) => <button key={m.id} onClick={() => pick(m)} className={`shrink-0 rounded border px-2 py-1 hover:bg-night ${m.id === s.m ? "border-electric" : "border-night-line"}`}>
        <b className={m.kind === "protest" ? "text-ageing" : "text-overdue"}>{KIND_LABEL[m.kind]}</b> {m.place}{m.unspecified ? "*" : ""}, {m.country} · <span className="text-night-muted">{m.warning.source} {fmtStamp(m.warning.updated)}</span>
      </button>)}
    {unrest && <span className="shrink-0 text-night-muted">· checked {fmtStamp(unrest.fetchedAt)}</span>}
    {feed?.connected && <button onClick={() => onChange({ feed: "live" })} className="shrink-0 rounded border border-electric/60 px-2 py-1 font-mono uppercase text-electric-soft hover:bg-night">{feed.items.filter((i) => i.live).length ? `● ${feed.items.filter((i) => i.live).length} live now` : "Live feed"}</button>}
  </div>;

  return <div className={broadcast ? "flex h-full min-h-0 flex-col overflow-hidden" : compact ? "overflow-hidden rounded-lg border border-night-line" : "flex flex-1 flex-col"}>{!broadcast && <><div aria-label="Latest official warnings and news headlines" className="flex h-8 items-center overflow-hidden border-b border-desk-line bg-desk text-xs text-desk-fg [contain:layout_paint]">
    <span className="flex h-full shrink-0 items-center bg-onair px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-desk-fg">Latest</span>
    {headlines.length ? <div className="min-w-0 flex-1 overflow-hidden"><div className="ticker-track flex w-max">{[0, 1].map((r) => <div key={r} aria-hidden={r === 1 || undefined} className="flex shrink-0">{headlines.map((h) => <button key={h.id} tabIndex={r ? -1 : 0} onClick={h.go} className="max-w-[24rem] shrink-0 truncate border-r border-desk-line px-3 hover:underline">{h.text}</button>)}</div>)}</div></div>
      : <span className="px-3 text-desk-muted">Waiting for the official feeds…</span>}
  </div>{ticker}</>}<div className={`relative flex flex-col bg-night text-night-fg lg:flex-row ${compact ? "" : "min-h-0 flex-1"}`}>
    <section aria-label="Interactive globe" className={`relative flex-1 ${height}`} onPointerDownCapture={() => { if (!broadcast) setOnAir(false); }} onWheelCapture={() => { if (!broadcast) setOnAir(false); }}>
      {gl === false ? <div className="h-full overflow-y-auto p-4 pt-44">
        <p className="text-sm text-night-muted">Your device can't show the 3D globe. Pick a country instead:</p>
        <ul className="mt-2 grid grid-cols-2 gap-1 text-sm sm:grid-cols-3">{names.map((c) => <li key={c.iso3}><button className="w-full rounded px-2 py-1 text-left hover:bg-night-panel" onClick={() => onChange({ c: countryKey(c.name) })}>{c.name}</button></li>)}</ul>
      </div> : <ClientOnly fallback={loading}><Suspense fallback={loading}>
        {gl && <EarthGlobe shade={null} fill={advice?.fill ?? stat?.fill ?? null} labels={advice?.labels ?? stat?.labels ?? null} rotate={rotate} resetKey={resetKey} hotspots={hotKeys} events={research.length ? [] : events} selected={sel} onSelect={(k) => onChange({ c: k, m: undefined })} markers={markers} onMarker={(id) => { const m = official.find((x) => x.id === id); if (m) pick(m); }} focus={marker ? { lat: marker.lat, lng: marker.lng } : cam ? { lat: cam.lat, lng: cam.lng } : plane ? { lat: plane.p[2], lng: plane.p[3] } : null} planes={globePlanes} onPlane={(id) => onChange({ fp: id })} planePaths={planePaths} boats={globeBoats} flows={globeFlows} quakes={globeQuakes} sats={globeSats} cams={globeCams} onCam={setCamId} preset={preset} dayNight={s.dn !== false} onTelemetry={compact || broadcast ? undefined : setTele} feedPins={pins} onFeedPin={(k) => onChange({ c: k, m: undefined, feed: "live" })} />}
      </Suspense></ClientOnly>}
      {cam && <CamViewer cam={cam} all={globeCams} onPick={setCamId} onClose={() => setCamId(null)} />}
      <div className={`absolute inset-x-3 top-3 z-20 flex items-start gap-2 text-xs sm:right-16 ${broadcast ? "hidden" : ""} ${panel === "search" ? "" : "max-sm:hidden"}`}>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 rounded-lg border border-night-line bg-night-panel/90 p-1.5 shadow-lg backdrop-blur sm:flex-nowrap">
        {compact ? <h2 className="sr-only">Explore the world — click any country</h2> : <h1 className="sr-only">World globe</h1>}
        <form onSubmit={find} role="search" className="flex min-w-0 flex-1 gap-1 max-sm:basis-full sm:max-w-72">
          <label htmlFor={compact ? "globe-q-home" : "globe-q"} className="sr-only">Find a country</label>
          <div className="relative flex-1"><Search aria-hidden="true" className="absolute left-2 top-2 size-3.5 text-night-muted" />
            <input id={compact ? "globe-q-home" : "globe-q"} list="globe-country-names" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a country…" className="w-full rounded border border-night-line bg-night py-1.5 pr-2 pl-7" />
          </div>
          <Button type="submit" size="sm">Go</Button>
          <datalist id="globe-country-names">{names.map((c) => <option key={c.iso3} value={c.name} />)}</datalist>
        </form>
          <span className="flex shrink-0 gap-1 max-sm:hidden">
          <button type="button" onClick={() => openPanel("layers")} aria-expanded={layersOpen} aria-controls="globe-layers" className={`${TB} ${layersOpen ? "bg-night" : ""}`}><Layers className="size-3.5" />Layers</button>
          <button type="button" onClick={() => { onChange({ cam: true }); openPanel("cams"); }} aria-expanded={panel === "cams"} aria-controls="globe-cams" className={`${TB} ${panel === "cams" ? "bg-night" : ""}`}><Video className="size-3.5" />Cameras</button>
          <button type="button" onClick={() => openPanel("key")} aria-expanded={keyOpen} aria-controls="globe-key" className={`${TB} ${keyOpen ? "bg-night" : ""}`}><Info className="size-3.5" />Key</button>
          <button type="button" onClick={() => { if (!sel) onChange({ c: UK_KEY, m: undefined }); setOnAir((o) => !o); }} aria-pressed={onAir} className={`${TB} ${onAir ? "bg-night" : ""}`}>{onAir ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}{onAir ? "Stop tour" : "Tour"}</button>
          </span>
          <GlobeShare title={`${selName ? `${selName} — ` : ""}live globe | UKStats`} />
        </div>
      </div>
      {layersOpen && <div id="globe-layers" role="dialog" aria-label="Globe layers" onKeyDown={(e) => { if (e.key === "Escape") setLayersOpen(false); }} className="z-40 overflow-y-auto border border-night-line bg-night-panel p-3 text-xs shadow-2xl max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[55dvh] max-sm:rounded-t-xl sm:absolute sm:left-3 sm:top-16 sm:max-h-[calc(100%-6rem)] sm:w-80 sm:rounded-md sm:bg-night-panel/95 sm:backdrop-blur">
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
        <label className="mt-2 flex items-start gap-2"><input type="checkbox" className="mt-0.5" checked={!!s.fl} onChange={(e) => onChange({ fl: e.target.checked || undefined, fp: undefined })} /> <span><b>Flights</b>: live aircraft positions{s.fl && flights ? ` — ${flights.planes.length.toLocaleString("en-GB")} planes` : ""}
          {s.fl && <span className="mt-1 block text-night-muted"><Swatch c="#3fcf7a" />Green: normal <Swatch c="#f0a020" />Amber: radio failure, or over a Level 3 / FCDO lower warning country <Swatch c="#ff4a3a" />Red: emergency or hijack code, or over a Level 4 / FCDO "all travel" country. Colours use the country the plane is over now, not where it is going (the feed has no destinations).</span>}</span></label>
        <label className="mt-2 flex items-start gap-2"><input type="checkbox" className="mt-0.5" checked={!!s.mg} onChange={(e) => onChange({ mg: e.target.checked || undefined })} /> <span><b>Migration</b>: small boats to the UK and irregular migration routes
          {s.mg && <span className="mt-1 block text-night-muted"><Swatch c="#f05a28" />Boats: one per boat on the latest Home Office day <Swatch c="#f0a020" />EU illegal crossings (Frontex, 12 months) <Swatch c="#ff4a3a" />US southwest border encounters (CBP, latest month) <Swatch c="#7fb2ff" />Refugees and asylum seekers living abroad (UNHCR, yearly — not illegal crossings). Thicker = more people.</span>}</span></label>
        <label className="mt-2 flex items-start gap-2"><input type="checkbox" className="mt-0.5" checked={!!s.nw} onChange={(e) => onChange({ nw: e.target.checked || undefined })} /> <span><b>News &amp; police reports</b>: protests, riots and planes diverted, grounded or searched{s.nw && reports ? ` — ${reports.items.length} in 3 days` : ""}
          {s.nw && <span className="mt-1 block text-night-muted">Headlines from BBC, Guardian, Sky News and other publishers found through Google News, plus Police Scotland notices, shown word for word. News reports are not official warnings.</span>}</span></label>
        <label className="mt-2 flex items-start gap-2"><input type="checkbox" className="mt-0.5" checked={!!s.eq} onChange={(e) => onChange({ eq: e.target.checked || undefined })} /> <span><b>Earthquakes</b>: magnitude 2.5+, past 24 hours{s.eq && quakeData ? ` — ${quakeData.items.length}` : ""}
          {s.eq && <span className="mt-1 block text-night-muted"><Swatch c="#c86bff" />Taller and wider = stronger. Source: <a className="underline" href={QUAKE_SOURCE.url} target="_blank" rel="noreferrer noopener">{QUAKE_SOURCE.name}</a>{quakeData ? `, checked ${fmtStamp(new Date(quakeData.at).toISOString())}` : ""}.</span>}</span></label>
        <label className="mt-2 flex items-start gap-2"><input type="checkbox" className="mt-0.5" checked={s.dn !== false} onChange={(e) => onChange({ dn: e.target.checked ? undefined : false })} /> <span><b>Day and night</b>: shade the side of the Earth in darkness, with the sunrise and sunset line</span></label>
        <label className="mt-2 flex items-start gap-2"><input type="checkbox" className="mt-0.5" checked={!!s.cam} onChange={(e) => { onChange({ cam: e.target.checked || undefined }); if (!e.target.checked) setCamId(null); }} /> <span><b>Public cameras</b>: road cameras run by public transport authorities{s.cam && camData ? ` — ${camData.items.length.toLocaleString("en-GB")}` : ""}
          {s.cam && <span className="mt-1 block text-night-muted"><Swatch c="#4fd1ff" />Click a dot to view. Transport for London and Caltrans open data; most are still pictures updated every few minutes. Scene only — not a source of figures.</span>}</span></label>
        <label className="mt-2 flex items-start gap-2"><input type="checkbox" className="mt-0.5" checked={!!s.st} onChange={(e) => onChange({ st: e.target.checked || undefined })} /> <span><b>Satellites</b>: space stations and Earth-watching satellites{s.st ? ` — ${globeSats.length}` : ""}
          {s.st && <span className="mt-1 block text-night-muted"><Swatch c="#8cf0ff" />Positions worked out from <a className="underline" href={SAT_SOURCE.url} target="_blank" rel="noreferrer noopener">{SAT_SOURCE.name}</a> (refreshed twice a day); line shows the next 90 minutes.</span>}</span></label>
        <div className="mt-2 flex gap-3">
          <label className="flex items-center gap-1"><input type="checkbox" checked={showRiots} onChange={(e) => onChange({ riots: e.target.checked })} /> Riots</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={showProtests} onChange={(e) => onChange({ protests: e.target.checked })} /> Protests</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={showMil} onChange={(e) => onChange({ mil: e.target.checked })} /> Military strikes &amp; war zones</label>
        </div>
        {compact && <Link to="/globe" search={{ ...s, layer: s.layer, gov: s.gov, age: s.age, cmp: s.cmp }} className="mt-2 inline-flex items-center gap-1 text-electric-soft underline"><Maximize2 className="size-3" />Open full-screen globe</Link>}
        {!broadcast && <a href={LIVE_STREAM_URL} target="_blank" rel="noopener" className="mt-2 ml-3 inline-flex items-center gap-1 text-electric-soft underline"><span className="size-2 rounded-full bg-destructive" aria-hidden="true" />Watch the live stream</a>}
      </div>}
      {panel === "cams" && <div id="globe-cams" role="dialog" aria-label="Public cameras" onKeyDown={(e) => { if (e.key === "Escape") setPanel(null); }} className="z-40 overflow-y-auto border border-night-line bg-night-panel p-3 text-xs shadow-2xl max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:max-h-[60dvh] max-sm:rounded-t-xl sm:absolute sm:left-3 sm:top-16 sm:max-h-[calc(100%-6rem)] sm:w-80 sm:rounded-md sm:bg-night-panel/95 sm:backdrop-blur">
        <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Public cameras</h2><Button variant="ghost" size="icon" aria-label="Close cameras" onClick={() => setPanel(null)}><X className="size-4" /></Button></div>
        <p className="text-night-muted"><span className="font-bold text-destructive">● Red</span> = live video (Caltrans, California). <span className="font-bold text-electric-soft">● Blue</span> = short loops (London TfL) or still pictures. Road cameras from public transport authorities only. Scene only — not a source of figures.</p>
        <div className="mt-2 flex gap-1">{[["united kingdom", "London"], ["united states", "California"]].map(([k, l]) => <button key={k} type="button" onClick={() => onChange({ c: k, m: undefined, cam: true })} className={`${TB} min-h-9 ${sel === k ? "bg-night" : ""}`}><MapPin className="size-3.5" />{l}</button>)}</div>
        {!camData ? <p className="mt-2 text-night-muted">Loading cameras…</p> : <div className="-ml-6"><CamList cams={globeCams} country={sel ?? ""} onPick={(id) => { setCamId(id); if (window.matchMedia("(max-width: 639px)").matches) setPanel(null); }} /></div>}
      </div>}
      {keyOpen && <GlobeKey onClose={() => setKeyOpen(false)} />}
      {(stat && ind || s.layer) && !layersOpen && <div aria-label="Colour key" className="absolute right-3 bottom-14 z-10 max-w-[60%] rounded-md border border-night-line bg-night-panel/90 p-2 text-[10px] backdrop-blur sm:top-3 sm:bottom-auto sm:max-w-56">
        {stat && ind ? <><p className="truncate font-semibold">{ind.label} · {stat.newest ?? "—"}</p><div className="mt-1 h-1.5 rounded" style={{ background: `linear-gradient(to right, ${shadeColour(0)}, ${shadeColour(0.5)}, ${shadeColour(1)})` }} /><div className="flex justify-between font-mono text-night-muted"><span>Low rank</span><span>Rank 1</span></div></>
          : s.layer === "us" ? <ul>{[1, 2, 3, 4].map((l) => <li key={l}><Swatch c={US_LEVEL_COLOURS[l]!} />Level {l}</li>)}<li className="text-night-muted">US State Dept</li></ul>
          : <ul>{(["all", "all-but-essential", "parts-all", "parts-essential", "none"] as FcdoAlert[]).map((a) => <li key={a} className="truncate"><Swatch c={UK_ALERT_COLOURS[a]} />{FCDO_ALERT_LABEL[a].replace("FCDO advises against ", "Against ")}</li>)}<li className="text-night-muted">UK FCDO</li></ul>}
      </div>}
      {gl && !broadcast && <NewsScreens storageKey={compact ? "ukstats-news-screens-home" : undefined} countries={screenCountries} bulletinFor={bulletinFor} step={stepCountry} defaultCountry={UK_KEY} />}
      {gl && !broadcast && <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1" aria-label="Zoom">
        {(["in", "out"] as const).map((k) => <button key={k} type="button" aria-label={k === "in" ? "Zoom in" : "Zoom out"} onClick={() => setPreset((p) => ({ n: (p?.n ?? 0) + 1, kind: k }))} className="grid size-9 place-items-center rounded border border-night-line bg-night-panel/80 text-lg font-bold text-night-fg backdrop-blur hover:bg-night">{k === "in" ? "+" : "−"}</button>)}
      </div>}
      {gl && !broadcast && !compact && <GlobeHud tele={tele} onPreset={(kind) => setPreset((p) => ({ n: (p?.n ?? 0) + 1, kind }))} canFocus={!!sel} />}
      {!broadcast && <nav aria-label="Globe menu" className="absolute inset-x-2 bottom-2 z-20 grid grid-cols-4 gap-1 rounded-xl border border-night-line bg-night-panel/95 p-1 text-[11px] shadow-lg backdrop-blur sm:hidden">
        {([["search", Search, "Search"], ["layers", Layers, "Layers"], ["cams", Video, "Cameras"]] as const).map(([k, I, l]) => <button key={k} type="button" aria-expanded={panel === k} onClick={() => { if (k === "cams") onChange({ cam: true }); openPanel(k); }} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg ${panel === k ? "bg-night text-night-fg" : "text-night-muted"}`}><I className="size-5" />{l}</button>)}
        <button type="button" aria-expanded={sheetOpen} onClick={() => { if (!sel) openPanel("search"); else { setPanel(null); setSheetOpen((o) => !o); } }} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg ${sheetOpen ? "bg-night text-night-fg" : "text-night-muted"}`}><Landmark className="size-5" /><span className="max-w-full truncate px-1">{sel ? selName : "Country"}</span></button>
      </nav>}
      {gl && !broadcast && <div aria-label="Globe controls" className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1 text-xs max-sm:hidden">
        <button onClick={nextWarning} disabled={!listed.length} aria-label="Next warning" className={CTRL}><SkipForward className="size-3.5" /><span className="max-sm:sr-only">Next warning</span></button>
        <button onClick={nextCountry} aria-label="Next country" className={CTRL}><SkipForward className="size-3.5" /><span className="max-sm:sr-only">Next country</span></button>
        <button onClick={() => setRotate((r) => !r)} aria-pressed={!!rotate} aria-label={rotate ? "Stop spin" : "Spin"} className={CTRL}>{rotate ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}<span className="max-sm:sr-only">{rotate ? "Stop spin" : "Spin"}</span></button>
        <button onClick={() => { setResetKey((k) => k + 1); onChange({ c: "", m: undefined }); }} aria-label="Reset view" className={CTRL}><RotateCcw className="size-3.5" /><span className="max-sm:sr-only">Reset view</span></button>
      </div>}
    </section>

    {!broadcast && <aside aria-label="Country controls" className={`w-full overflow-y-auto border-t border-night-line bg-night-panel p-4 lg:w-[380px] lg:border-l lg:border-t-0 ${compact ? "max-h-[620px]" : "lg:max-h-[calc(100dvh-64px)]"} ${!compact && sel ? `max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-30 max-lg:rounded-t-xl max-lg:border max-lg:shadow-2xl ${sheetOpen ? "max-lg:max-h-[60dvh]" : "max-lg:max-h-16 max-lg:overflow-hidden"}` : ""}`}>
      {!compact && sel && <button onClick={() => setSheetOpen((o) => !o)} aria-expanded={sheetOpen} className="mx-auto -mt-2 mb-2 flex min-h-8 w-full items-center justify-center gap-1 text-xs text-night-muted lg:hidden"><span className="h-1 w-10 rounded bg-night-line" /><b className="text-night-fg">{selName}</b> · {sheetOpen ? "Lower panel" : "Raise panel"}<ChevronDown className={`size-3.5 ${sheetOpen ? "" : "rotate-180"}`} /></button>}
      {unrest ? <p className="font-mono text-[11px] text-night-muted">Checked {fmtDate(unrest.fetchedAt)} · UK FCDO {unrest.fcdoOk ? "answered" : "unavailable"} · US State Dept {unrest.stateOk ? "answered" : "unavailable"}</p>
        : <p className="font-mono text-[11px] text-night-muted">Loading official warning feeds…</p>}

      {s.fl && <p className="mt-1 font-mono text-[11px] text-night-muted"><PlaneIcon className="mr-1 inline size-3" />{!flights ? "Loading aircraft positions…" : flights.error && !flights.planes.length ? "Flight data unavailable" : `Aircraft positions from ${flights.source}${flights.partial ? " (busiest regions plus emergencies worldwide)" : ""} — not official government data`}{flights ? ` · checked ${fmtStamp(flights.fetchedAt)}` : ""}</p>}
      {s.nw && <ReportsCard data={reports} onPlace={(r) => r.place && onChange({ c: countryKey(r.place.split(", ").pop()!), m: undefined })} />}
      {s.mg && <MigrationCard boats={latestBoatDay} year={boatYear} boatsPublished={boatsData?.recentPublished ?? boatsData?.published ?? null} m={migration} />}
      {plane && <div className={`mt-3 rounded border p-3 ${plane.status === "red" ? "border-overdue/60" : plane.status === "amber" ? "border-ageing/60" : "border-fresh/60"}`} aria-label="Selected aircraft">
        <div className="flex items-start justify-between gap-2"><p className={`font-mono text-[11px] uppercase ${plane.status === "red" ? "text-overdue" : plane.status === "amber" ? "text-ageing" : "text-fresh"}`}><PlaneIcon className="mr-1 inline size-3" />{plane.p[1] || plane.p[0]} · {plane.status}</p>
          <Button variant="ghost" size="icon" aria-label="Close aircraft" onClick={() => onChange({ fp: undefined })}><X className="size-4" /></Button></div>
        <p className="text-sm">{plane.reason}.</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[11px]">
          <dt className="text-night-muted">Registration</dt><dd>{plane.p[9] || "not stated"}</dd>
          <dt className="text-night-muted">Altitude</dt><dd>{plane.p[4] === null ? "not stated" : `${plane.p[4].toLocaleString("en-GB")} ft`}</dd>
          <dt className="text-night-muted">Speed</dt><dd>{plane.p[5] === null ? "not stated" : `${plane.p[5]} kt`}</dd>
          <dt className="text-night-muted">Heading</dt><dd>{plane.p[6] === null ? "not stated" : `${Math.round(plane.p[6])}°`}</dd>
          <dt className="text-night-muted">Squawk</dt><dd>{plane.p[7] ?? "not stated"}</dd>
          <dt className="text-night-muted">Over</dt><dd className="capitalize">{plane.p[8] ?? "sea / unknown"}</dd>
          <dt className="text-night-muted">Position time</dt><dd>{fmtStamp(new Date(plane.p[10] * 1000).toISOString())}</dd>
        </dl>
        {planeAdvice && (planeAdvice.uk || planeAdvice.us) && <ul className="mt-2 space-y-0.5 text-xs">
          {planeAdvice.uk && <li><a className="underline" href={planeAdvice.uk.url} target="_blank" rel="noreferrer noopener">{planeAdvice.uk.label}</a> <span className="text-night-muted">· UK FCDO</span></li>}
          {planeAdvice.us && <li><a className="underline" href={planeAdvice.us.url} target="_blank" rel="noreferrer noopener">{planeAdvice.us.label}</a> <span className="text-night-muted">· US State Dept</span></li>}
        </ul>}
        <p className="mt-2 text-[11px] text-night-muted">Solid line: recent track. Dashed line: direction of travel only, not a route.</p>
      </div>}
      {sel && !onAir && <button onClick={() => setOnAir(true)} className="mt-2 inline-flex items-center gap-1 rounded border border-electric/50 px-2 py-1 text-xs hover:bg-night"><Play className="size-3" />Start live broadcast</button>}
      {sel && onAir && <div className="mt-3"><BroadcastPanel name={selName ?? sel} stats={bulletinStats} statSource={wb ? WORLD_SOURCE : null} warnings={warnings} videos={countryVideos} channels={BROADCAST_CHANNELS[sel] ?? []} onNextCountry={goNext} onPrevCountry={goPrev} onStop={() => setOnAir(false)} /></div>}
      {sel ? <div className="mt-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-2xl font-semibold">{selName}</h2>
          <Button variant="ghost" size="icon" aria-label="Close country" onClick={() => onChange({ c: "", m: undefined })}><X className="size-4" /></Button>
        </div>
        {marker && marker.key === sel && <div className={`mt-3 rounded border p-3 ${marker.kind === "protest" ? "border-ageing/60" : "border-overdue/60"}`}>
          <p className={`font-mono text-[11px] uppercase ${marker.kind === "protest" ? "text-ageing" : "text-overdue"}`}>{KIND_LABEL[marker.kind]} warning · {marker.place}{marker.unspecified ? " (country-wide advice — location not specified)" : ""}</p>
          <p className="mt-1 text-sm">“{marker.warning.text}”</p>
          <p className={`mt-1 font-mono text-[11px] ${AGE_CLS[warningAge(marker.warning.updated, new Date())]}`}>{marker.warning.source} · published {fmtStamp(marker.warning.updated)} · {warningAge(marker.warning.updated, new Date())}</p>
          <a href={marker.warning.url} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 text-xs underline">Read the official advice <ExternalLink className="size-3" /></a>
          {BROADCAST_CHANNELS[marker.key]?.length ? <><p className="mt-3 text-xs font-semibold">Watch live coverage</p><BroadcastChannels k={marker.key} limit={1} /></> : null}
        </div>}
        {stat && ind && <p className="mt-2 font-mono text-xs">{(() => { const r = stat.rank.get(sel); return r ? `${ind.label}: ${r.value} · rank ${r.rank} of ${r.of} (${r.year})` : `${ind.label}: no rankable figure`; })()}</p>}
        <AdviceLevels warnings={unrest?.warnings ?? []} k={sel} fcdo={unrest?.fcdoAlerts} />
        {wb && <div className="mt-3 rounded border border-night-line p-2 text-sm">{s.cmp && s.cmp !== wb.iso3
          ? <div className="flex flex-wrap items-center gap-2"><Link to="/world-compare" search={{ countries: `${s.cmp},${wb.iso3}` }} className="inline-flex items-center gap-1 font-semibold text-electric-soft underline">Compare {names.find((c) => c.iso3 === s.cmp)?.name ?? s.cmp} with {wb.name}<ArrowRight className="size-3.5" /></Link><button className="text-xs underline" onClick={() => onChange({ cmp: undefined })}>Clear</button></div>
          : s.cmp === wb.iso3 ? <p className="text-xs text-night-muted">Picked for comparison — now click a second country. <button className="underline" onClick={() => onChange({ cmp: undefined })}>Cancel</button></p>
          : <button onClick={() => onChange({ cmp: wb.iso3 })} className="text-left underline">Compare {wb.name} with another country</button>}</div>}
        {dests.length > 0 && <nav aria-label={`Pages for ${selName}`} className="mt-3 grid gap-1.5">{dests.map((d) => <DestLink key={d.kind + d.label} d={d} />)}</nav>}
        {wb ? <>
          <h3 className="mt-4 text-sm font-semibold">Top 6 figures</h3>
          <div className="mt-2 rounded border border-overdue/60 p-2 text-sm" aria-label="Irregular migration and small boats">
            <p className="text-[11px] font-semibold uppercase text-overdue">Irregular migration &amp; small boats</p>
            {sel === UK_KEY ? (latestBoatDay ? <>
              <p className="font-mono text-lg">{latestBoatDay.arrivals.toLocaleString("en-GB")} people · {latestBoatDay.boats} boats</p>
              <p className="text-[11px] text-night-muted">Crossed the Channel on {fmtDate(latestBoatDay.date)} (latest reported day) · <a className="underline" href="https://www.gov.uk/government/publications/migrants-detected-crossing-the-english-channel-in-small-boats" target="_blank" rel="noreferrer noopener">Home Office</a>{(boatsData?.recentPublished ?? boatsData?.published) ? ` · published ${fmtDate((boatsData.recentPublished ?? boatsData.published)!)}` : ""}</p>
            </> : <p className="text-night-muted">Loading Home Office small boats figures…</p>)
              : <p className="text-night-muted">Not published for this country. Regional figures: <a className="underline" href={MIGRATION_SOURCES.frontex.url} target="_blank" rel="noreferrer noopener">Frontex (EU)</a>, <a className="underline" href={MIGRATION_SOURCES.cbp.url} target="_blank" rel="noreferrer noopener">US CBP</a>, <a className="underline" href={MIGRATION_SOURCES.unhcr.url} target="_blank" rel="noreferrer noopener">UNHCR refugees</a>. Turn on the Migration layer to see them.</p>}
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
            {TOP_FIVE.map((id) => WORLD_INDICATORS.find((i) => i.id === id)!).map((i) => { const v = world?.values[i.id]?.[wb.iso3]; return <div key={i.id} className="rounded border border-night-line p-2"><dt className="text-[11px] text-night-muted">{i.label}</dt><dd className="font-mono">{v ? `${fmtWorld(v.value, i.unit)} (${v.year})` : "Not published"}</dd></div>; })}
          </dl>
          <p className="mt-1 text-[11px] text-night-muted">Source: <a className="underline" href={WORLD_SOURCE.url} target="_blank" rel="noreferrer noopener">{WORLD_SOURCE.name}</a></p>
        </> : <p className="mt-2 text-sm text-night-muted">No World Bank profile for this territory.</p>}

        <h3 className="mt-5 font-semibold">Official government warnings</h3>
        {warnings.length ? <ul className="mt-2 space-y-2">{warnings.map((w) => <WarningRow key={w.source + w.url} w={w} />)}</ul> : <p className="mt-1 text-sm text-night-muted">No UK or US travel advice found for this country.</p>}

        <h3 className="mt-5 font-semibold">Latest videos <span className="text-xs font-normal text-night-muted">(media, not official)</span></h3>
        <div className="mt-1"><LiveFeed feed={feed} country={sel} countryName={selName ?? undefined} paused={feedPaused} /></div>
        <h3 className="mt-5 font-semibold">Broadcast channels</h3>
        <BroadcastChannels k={sel} />
        <h3 className="mt-5 font-semibold">Official ministry and police links</h3>
        {live?.official.length ? <ul className="mt-1 space-y-1 text-sm">{live.official.map((l) => <li key={l.url}><a className="underline" href={l.url} target="_blank" rel="noreferrer noopener">{l.label}</a></li>)}</ul> : <p className="mt-1 text-sm text-night-muted">Not yet verified for this country.</p>}

        <h3 className="mt-5 font-semibold">News coverage <span className="text-xs font-normal text-night-muted">(not official)</span></h3>
        <ul className="mt-1 space-y-1 text-sm">{[...(live?.news ?? []), ...GLOBAL_NEWS].map((l) => <li key={l.url}><a className="underline" href={l.url} target="_blank" rel="noreferrer noopener">{l.label}</a></li>)}</ul>
        <p className="mt-2 text-[11px] text-night-muted">Links checked {fmtDate(LIVE_SOURCES_CHECKED)}.</p>
      </div> : <div className="mt-3">
        <div role="tablist" aria-label="Panel" className="mb-3 grid grid-cols-2 gap-1 text-sm">
          <button role="tab" aria-selected={s.feed !== "live"} onClick={() => onChange({ feed: undefined })} className={`rounded border px-2 py-1.5 ${s.feed !== "live" ? "border-electric bg-night" : "border-night-line"}`}>Warnings</button>
          <button role="tab" aria-selected={s.feed === "live"} onClick={() => onChange({ feed: "live" })} className={`rounded border px-2 py-1.5 ${s.feed === "live" ? "border-electric bg-night" : "border-night-line"}`}><span className="mr-1 inline-block size-1.5 rounded-full bg-overdue pulse-dot" />Live</button>
        </div>
        {s.feed === "live" ? <LiveFeed feed={feed} kind={s.fk} hours={s.fa} paused={feedPaused} onPause={() => setFeedPaused((p) => !p)} onFilter={(p) => onChange(p)} onCountry={(k) => onChange({ c: k, m: undefined })} /> : <>
        <h2 className="text-lg font-semibold">Click a country to open its pages</h2>
        <p className="mt-1 text-xs text-night-muted">Each country shows its key figures and buttons to every UKStats page we have for it.</p>
        <button className="mt-3 w-full rounded border border-electric/50 px-3 py-2 text-left text-sm hover:bg-night" onClick={() => onChange({ c: "united kingdom" })}><b>United Kingdom</b> <span className="text-xs text-night-muted">· all UK statistics, small boats, crime, parties…</span></button>
        <h3 className="mt-5 font-semibold">Official conflict, riot and protest warnings</h3>
        <div className="mt-2 flex flex-wrap gap-1 text-xs" role="group" aria-label="Filter warnings">
          {([["all", "Both governments"], ["FCDO", "UK FCDO"], ["US", "US State Dept"]] as const).map(([v, l]) => <button key={v} aria-pressed={(s.gov ?? "all") === v} onClick={() => onChange({ gov: v === "all" ? undefined : v })} className={`rounded border px-2 py-1 ${(s.gov ?? "all") === v ? "border-electric" : "border-night-line"}`}>{l}</button>)}
          {([[1, "24h"], [7, "7 days"], [30, "30 days"]] as const).map(([v, l]) => <button key={v} aria-pressed={(s.age ?? 30) === v} onClick={() => onChange({ age: v === 30 ? undefined : v })} className={`rounded border px-2 py-1 ${(s.age ?? 30) === v ? "border-electric" : "border-night-line"}`}>{l}</button>)}
        </div>
        <p className="mt-1 text-[11px] text-night-muted">Riot/protest switches on the globe also filter this list.</p>
        {listed.length ? <ul className="mt-2 space-y-1 text-sm">{listed.map((m) => <li key={m.id}><button onClick={() => pick(m)} className="w-full rounded border border-night-line px-3 py-2 text-left hover:bg-night">
          <b className={m.kind === "protest" ? "text-ageing" : "text-overdue"}>{KIND_LABEL[m.kind]}</b> · <b>{m.country}</b>{m.unspecified ? "" : ` — ${m.place}`}
          <span className="block text-xs text-night-muted">{m.warning.source} · {fmtStamp(m.warning.updated)}</span></button></li>)}</ul>
          : <p className="mt-2 text-sm text-night-muted">{!unrest ? "Waiting for the official feeds." : !s.official ? "Official layer is switched off." : "No matching warnings in this period."}</p>}
        <h3 className="mt-5 font-semibold">Countries flagged for unrest</h3>
        <p className="mt-1 text-xs text-night-muted">Where the UK Foreign Office or US State Department mentioned military strikes, armed conflict, protests, riots, strikes, curfews or a coup in their latest update within 30 days, quoted in their own words.</p>
        {hotList.length ? <ul className="mt-3 space-y-1 text-sm">{hotList.map(([k, ws]) => <li key={k}><button className="w-full rounded border border-night-line px-3 py-2 text-left hover:bg-night" onClick={() => onChange({ c: k })}><b>{ws[0]!.country}</b> <span className="text-xs text-night-muted">· {ws.map((w) => w.source).join(", ")} · {fmtDate(ws[0]!.updated)}</span></button></li>)}</ul> : <p className="mt-3 text-sm text-night-muted">{!unrest ? "Waiting for the official feeds." : s.official ? "None in the last 30 days." : "Official layer is switched off."}</p>}
        <p className="mt-4 text-[11px] text-night-muted">Governments publish travel advice, not live riot maps. ACLED is an independent research body, not a government source.</p>
      </>}</div>}
    </aside>}
  </div>
  {!broadcast && <p className="border-t border-night-line bg-night-panel px-3 py-2 text-[11px] text-night-muted">Governments publish travel advice, not live riot feeds: markers appear when their advice is updated, checked every 15 minutes, and always show the government's own publication time. * Advice names no place — marker shows the capital, not the exact spot. Places: Natural Earth.</p>}
  </div>;
}

type BoatDayLite = { date: string; arrivals: number; boats: number };
function MigrationCard({ boats, year, boatsPublished, m }: { boats: BoatDayLite | null; year: { arrivals: number; boats: number } | null; boatsPublished: string | null; m: import("@/lib/migration-flows").MigrationPayload | null | undefined }) {
  const n = (v: number) => v.toLocaleString("en-GB");
  const src = (k: keyof typeof MIGRATION_SOURCES, url?: string) => <a href={url ?? MIGRATION_SOURCES[k].url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-electric-soft underline">{MIGRATION_SOURCES[k].name}<ExternalLink className="size-3" /></a>;
  return <div className="mt-3 space-y-2 rounded border border-night-line p-3 text-xs" aria-label="Migration figures">
    <p className="font-mono text-[11px] uppercase text-night-muted">Small boats — France &amp; Belgium to UK, last 3 months</p>
    {boats ? <p className="text-sm"><b>{n(boats.boats)}</b> boats, <b>{n(boats.arrivals)}</b> people on {fmtDate(boats.date)}{year ? <> · {boats.date.slice(0, 4)} so far: <b>{n(year.arrivals)}</b> people in {n(year.boats)} boats</> : null}.</p> : <p className="text-night-muted">Loading Home Office figures…</p>}
    <p className="text-night-muted">One <span style={{ color: "#3fcf7a" }}>green boat icon</span> for every boat on every reported day in the last 3 months — all shown the same way. Click a boat for its date and that day's figures. The Home Office does not publish where each boat crossed or whether it left France or Belgium, so icons are spread across the Channel coast. {boatsPublished ? `Published ${fmtDate(boatsPublished)}. ` : ""}<a href={SMALL_BOATS_SOURCE.url} target="_blank" rel="noopener noreferrer" className="text-electric-soft underline">Home Office source</a> · <Link to="/small-boats" className="text-electric-soft underline">Full small-boats page</Link></p>
    <p className="pt-1 font-mono text-[11px] uppercase text-night-muted">Worldwide</p>
    {!m ? <p className="text-night-muted">Loading official migration files…</p> : <>
      {m.frontex ? <div><p><b>{n(m.frontex.routes.reduce((s, r) => s + r.last12, 0))}</b> illegal border crossings into the EU detected in the 12 months to {fmtMonth(m.frontex.months.at(-1))}; largest route: {m.frontex.routes[0]?.route} ({n(m.frontex.routes[0]?.last12 ?? 0)}).</p><p className="text-night-muted">{src("frontex", m.frontex.fileUrl)}</p></div> : <p className="text-night-muted">EU figures unavailable right now.</p>}
      {m.cbp ? <div><p><b>{n(m.cbp.total)}</b> encounters at the US southwest border in {m.cbp.period}.</p><p className="text-night-muted">{src("cbp", m.cbp.fileUrl)}</p></div> : <p className="text-night-muted">US border figures unavailable right now.</p>}
      {m.unhcr ? <div><p>Largest refugee populations by home and host country, end of {m.unhcr.year}: {m.unhcr.pairs.slice(0, 3).map((p) => `${p.from} → ${p.to} (${n(p.value)})`).join("; ")}. These are people given or seeking protection, not illegal crossings.</p><p className="text-night-muted">{src("unhcr")}</p></div> : <p className="text-night-muted">UN refugee figures unavailable right now.</p>}
      <p className="text-night-muted">No single official worldwide count of illegal migration exists; each publisher counts differently, so their figures are shown side by side and never added together. Route arrows end at approximate border points. Checked {fmtStamp(m.fetchedAt)}.</p>
    </>}
  </div>;
}
function fmtMonth(m: string | undefined) { return m ? `${m[0]}${m.slice(1, 3).toLowerCase()} ${m.slice(3)}` : ""; }

function ReportsCard({ data, onPlace }: { data: import("@/lib/news-reports").ReportsPayload | null | undefined; onPlace: (r: ReportItem) => void }) {
  if (!data) return <p className="mt-3 text-xs text-night-muted">Loading news and police reports…</p>;
  const group = (k: ReportItem["kind"][], title: string) => { const xs = data.items.filter((r) => k.includes(r.kind)); return <div><p className="pt-1 font-mono text-[11px] uppercase text-night-muted">{title} · {xs.length}</p>
    {xs.length ? <ul className="mt-1 space-y-1.5">{xs.slice(0, 25).map((r) => <li key={r.id}><a href={r.link} target="_blank" rel="noopener noreferrer" className="text-electric-soft underline">{r.title}</a>
      <p className="font-mono text-[10px] text-night-muted">{r.official ? "Police notice" : "News report"} · {r.publisher} · {fmtStamp(r.published)}{r.place && <> · <button type="button" className="underline" onClick={() => onPlace(r)}>{r.place}</button></>}</p></li>)}</ul>
      : <p className="text-night-muted">None in the last 3 days.</p>}</div>; };
  return <div className="mt-3 space-y-2 rounded border border-night-line p-3 text-xs" aria-label="News and police reports">
    {group(["protest", "riot"], "Protests & disorder")}
    {group(["aviation"], "Planes diverted, grounded or searched")}
    <p className="text-night-muted">Headlines are copied word for word from each publisher and link to the original. They are news, not government warnings, and are not checked by UKStats. Sources: {data.sources.map((x) => `${x.name}${x.ok ? "" : " (unavailable)"}`).join(", ")}. Checked {fmtStamp(data.fetchedAt)}. Emergency and radio-failure planes are shown in red and amber on the Flights layer.</p>
  </div>;
}
