// Pure helpers for stream overlays. They only pick from published metrics — never create figures.
import type { Metric } from "./uk-stats";
import { TOP_FIVE, WORLD_INDICATORS, fmtWorld, type WorldPayload } from "./world";
import type { BoatDay } from "./small-boats";
import { fmtDate } from "./uk-stats";

const ok = (m: Metric) => m.status === "ok" && !!m.value;

/** Figures the publisher released within the last `hours`, newest first. */
export function justPublished(metrics: Metric[], now: Date, hours = 36): Metric[] {
  const from = now.getTime() - hours * 3_600_000;
  return metrics
    .filter((m) => ok(m) && m.asOf && Date.parse(m.asOf) >= from && Date.parse(m.asOf) <= now.getTime())
    .sort((a, b) => Date.parse(b.asOf!) - Date.parse(a.asOf!));
}

/** Next announced releases still in the future, soonest first, one per title. */
export function upcomingReleases(metrics: Metric[], now: Date, max = 4): Metric[] {
  const seen = new Set<string>();
  return metrics
    .filter((m) => m.nextDue && Date.parse(m.nextDue) > now.getTime())
    .sort((a, b) => Date.parse(a.nextDue!) - Date.parse(b.nextDue!))
    .filter((m) => (seen.has(m.title) ? false : (seen.add(m.title), true)))
    .slice(0, max);
}

/** "2d 4h", "3h 12m", "12m" — time left until a release. */
export function countdown(iso: string, now: Date): string {
  const mins = Math.max(0, Math.floor((Date.parse(iso) - now.getTime()) / 60_000));
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
}

/** The published small-boats arrivals figure for the year so far, if the Home Office feed has one. */
export function boatsYearMetric(metrics: Metric[]): Metric | null {
  return metrics.find((m) => ok(m) && /small boat/i.test(m.title) && !m.title.includes(":") && !/-(male|female|sex|religion|ethnicity|age|nationality)/.test(m.id) && /(year|so far|20\d\d)/i.test(`${m.title} ${m.period ?? ""}`)) ?? null;
}

/** One box in the fixed "Top 6" strip. value null = not published (never estimated). */
export type TopBox = { id: string; label: string; value: string | null; when: string | null; source: string; migration?: boolean };

const SHORT: Record<string, string> = { "NY.GDP.PCAP.CD": "GDP per person", "GC.DOD.TOTL.GD.ZS": "Govt debt (% GDP)" };

/** Fixed Top 6: irregular migration & small boats first, then the five World Bank headline figures. */
export function topSix(
  world: WorldPayload | null | undefined, iso3: string | null,
  boats: { days?: BoatDay[]; series?: BoatDay[] } | null | undefined, isUk: boolean,
): TopBox[] {
  const d = boats?.days ?? boats?.series ?? [];
  const last = isUk && d.length ? d[d.length - 1]! : null;
  const mig: TopBox = {
    id: "migration", label: "Small boats", migration: true, source: isUk ? "Home Office" : "No official feed",
    value: last ? `${last.arrivals.toLocaleString("en-GB")} people` : null,
    when: last ? `${last.boats} boats · ${fmtDate(last.date)}` : null,
  };
  const rest = TOP_FIVE.map((id) => {
    const i = WORLD_INDICATORS.find((x) => x.id === id)!;
    const v = iso3 ? world?.values[id]?.[iso3] : undefined;
    return { id, label: SHORT[id] ?? i.label, value: v ? fmtWorld(v.value, i.unit) : null, when: v ? String(v.year) : null, source: "World Bank" };
  });
  return [mig, ...rest];
}

/** Short publisher tag for overlay chips, taken from the metric's own source line. */
export function publisherTag(source: string): string {
  const t = source.split(/\s+[·|—-]\s+|\s+via\s+|,/)[0]!.trim();
  return /office for national statistics/i.test(t) ? "ONS" : t;
}

export type KeyFigure = { id: string; label: string; value: string; period: string | null; publisher: string; alert?: boolean };

/**
 * Orbit stats rail: national debt, small boats, inflation, then official alert levels.
 * Only figures that are published right now; a missing one is skipped, never shown as 0.
 */
export function keyFigures(metrics: Metric[], max = 4): KeyFigure[] {
  const byId = (id: string) => metrics.find((m) => m.id === id && ok(m)) ?? null;
  const picks: [Metric | null, string, boolean?][] = [
    [byId("uk-national-debt"), "National debt"],
    [boatsYearMetric(metrics), "Small boats"],
    [byId("uk-cpi"), "Inflation (CPI)"],
    [byId("uk-metoffice-warnings"), "Weather warnings", true],
    [byId("uk-threat-level"), "Terror threat", true],
  ];
  return picks.filter((p): p is [Metric, string, boolean?] => !!p[0]).slice(0, max)
    .map(([m, label, alert]) => ({ id: m.id, label, value: m.value!, period: m.period, publisher: publisherTag(m.source), alert: !!alert }));
}

/** "Checked today" when the register was fetched on the same London day, else the check date. */
export function checkedLabel(fetchedAt: string | null | undefined, now: Date): string | null {
  if (!fetchedAt) return null;
  const d = (x: Date) => x.toLocaleDateString("en-GB", { timeZone: "Europe/London" });
  const f = new Date(fetchedAt);
  if (Number.isNaN(f.getTime())) return null;
  return d(f) === d(now) ? "Checked today" : `Checked ${fmtDate(fetchedAt)}`;
}
