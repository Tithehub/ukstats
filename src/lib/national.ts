// Wave 2: national official sources. Pure parsers (no network) + per-country definitions.
import type { CountryMetric } from "@/lib/countries";

export type Pt = { time: string; value: number };

/** Year-on-year % change from a published monthly index; null unless the exact month a year earlier is published. */
export function yoyFromIndex(pts: Pt[]): Pt[] {
  const by = new Map(pts.map((p) => [p.time, p.value]));
  const out: Pt[] = [];
  for (const p of pts) {
    const [y, m] = p.time.split("-");
    const prev = by.get(`${Number(y) - 1}-${m}`);
    if (prev && prev > 0) out.push({ time: p.time, value: Math.round(((p.value / prev - 1) * 100) * 10) / 10 });
  }
  return out;
}

export function parseBls(js: unknown): Pt[] {
  const d = (js as { Results?: { series?: { data?: { year: string; period: string; value: string }[] }[] } })?.Results?.series?.[0]?.data ?? [];
  return d
    .filter((r) => /^M(0[1-9]|1[0-2])$/.test(r.period) && Number.isFinite(Number(r.value)) && r.value !== "-" && r.value.trim() !== "")
    .map((r) => ({ time: `${r.year}-${r.period.slice(1)}`, value: Number(r.value) }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function parseStatCan(js: unknown, vectorId: number): Pt[] {
  const row = (js as { object?: { vectorId: number; vectorDataPoint: { refPer: string; value: number | null }[] } }[])?.find((r) => r.object?.vectorId === vectorId);
  return (row?.object?.vectorDataPoint ?? [])
    .filter((p) => typeof p.value === "number" && Number.isFinite(p.value))
    .map((p) => ({ time: p.refPer.slice(0, 7), value: p.value as number }));
}

/** ABS SDMX CSV: TIME_PERIOD + OBS_VALUE columns. */
export function parseSdmxCsv(csv: string): Pt[] {
  const lines = csv.trim().split(/\r?\n/);
  const head = (lines.shift() ?? "").split(",");
  const ti = head.indexOf("TIME_PERIOD"), vi = head.indexOf("OBS_VALUE");
  if (ti < 0 || vi < 0) return [];
  return lines
    .map((l) => l.split(","))
    .filter((c) => typeof c[ti] === "string" && typeof c[vi] === "string" && c[vi]?.trim() !== "" && Number.isFinite(Number(c[vi])))
    .map((c) => ({ time: c[ti] ?? "", value: Number(c[vi]) }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function noFeed(id: string, title: string, source: string, sourceUrl: string, note: string, cadence = "See publisher"): CountryMetric {
  return { id, title, value: null, period: null, asOf: null, cadence, source, sourceUrl, spark: [], history: [], status: "no-feed", calendarUrl: sourceUrl, raw: null, note, next: "See publisher's release calendar" };
}

/* ------------------------------ Warning feeds ------------------------------ */
// Two national warning services publish GeoJSON rather than CAP. Both parsers are
// pure: a payload that is not the expected shape yields null, so the caller shows
// no figure at all instead of a count that quietly left somewhere out.

export type EcccAlerts = {
  count: number;
  /** Highest risk colour published, or null when no warning carries one. */
  worst: string | null;
  main: { name: string; areas: number } | null;
  provinces: { code: string; count: number }[];
};

const ECCC_RANK: Record<string, number> = { yellow: 1, orange: 2, red: 3 };

/** Read one text field out of a GeoJSON feature's properties. */
function str(p: Record<string, unknown> | undefined, key: string): string {
  const v = p?.[key];
  return typeof v === "string" ? v.trim() : "";
}

const rankOf = (colour: string): number => ECCC_RANK[colour] ?? 0;

/** Environment and Climate Change Canada's active-warning collection. */
export function parseEcccAlerts(js: unknown): EcccAlerts | null {
  const feats = (js as { features?: unknown })?.features;
  if (!Array.isArray(feats)) return null;
  const names = new Map<string, number>();
  const provs = new Map<string, number>();
  let worst: string | null = null;
  let count = 0;
  for (const f of feats) {
    const p = (f as { properties?: Record<string, unknown> })?.properties;
    const name = str(p, "alert_name_en");
    if (!name) continue;
    count++;
    names.set(name, (names.get(name) ?? 0) + 1);
    const colour = str(p, "risk_colour_en").toLowerCase();
    if (rankOf(colour) && (!worst || rankOf(colour) > rankOf(worst))) worst = colour;
    const prov = str(p, "province");
    if (prov) provs.set(prov, (provs.get(prov) ?? 0) + 1);
  }
  let main: { name: string; areas: number } | null = null;
  for (const [name, areas] of names) if (!main || areas > main.areas) main = { name, areas };
  return {
    count,
    worst,
    main,
    provinces: [...provs].map(([code, n]) => ({ code, count: n })).sort((a, b) => b.count - a.count),
  };
}

export type NwsAlert = { id: string; event: string };

/** US National Weather Service active warnings: one GeoJSON page per state.
 * Null means the page is not a warning list, so a national count built from it
 * would be incomplete and must not be published. */
export function parseNwsAlerts(js: unknown): NwsAlert[] | null {
  const feats = (js as { features?: unknown })?.features;
  if (!Array.isArray(feats)) return null;
  const out: NwsAlert[] = [];
  for (const f of feats) {
    const p = (f as { properties?: Record<string, unknown> })?.properties;
    const id = str(p, "id");
    const event = str(p, "event");
    if (!id || !event) continue;
    // The service keeps its alerting system alive with test traffic.
    if (/keepalive/i.test(id) || /^test message$/i.test(event)) continue;
    out.push({ id, event });
  }
  return out;
}


/** One warning covering several states arrives once per state: count it once. */
export function dedupeAlerts(alerts: NwsAlert[]): NwsAlert[] {
  const seen = new Set<string>();
  return alerts.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
}

/** Most frequent warning type, with how many warnings of that type are live. */
export function mainWarning(alerts: NwsAlert[]): { event: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const a of alerts) counts.set(a.event, (counts.get(a.event) ?? 0) + 1);
  let best: { event: string; count: number } | null = null;
  for (const [event, count] of counts) if (!best || count > best.count) best = { event, count };
  return best;
}

