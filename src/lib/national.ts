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
