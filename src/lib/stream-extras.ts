// Pure helpers for stream overlays. They only pick from published metrics — never create figures.
import type { Metric } from "./uk-stats";

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
  return metrics.find((m) => ok(m) && /small boat/i.test(m.title) && /(year|so far|20\d\d)/i.test(`${m.title} ${m.period ?? ""}`)) ?? null;
}
