import type { Metric } from "./uk-stats";

export const UKHSA_ALERT_URL = "https://ukhsa-dashboard.data.gov.uk/weather-health-alerts";
export const UKHSA_ALERT_FEED = "https://ukhsa-dashboard.data.gov.uk/api/proxy/alerts/v1";
const REGIONS = Array.from({ length: 9 }, (_, i) => `E1200000${i + 1}`);
const LEVELS = ["Green", "Yellow", "Amber", "Red"] as const;
interface HealthRecord { status: string; geography_code: string; geography_name: string; refresh_date: string; period_start?: string; period_end?: string }

/** Strict structured records only; a stale or expired filing never means no alerts. */
export function healthAlertMetric(records: unknown, now = new Date()): Metric {
  const base = unavailableHealthAlert("The official structured alert feed has no complete, current set of nine English regions. Check UKHSA directly; no level is assumed.");
  if (!Array.isArray(records)) return base;
  const rows = records.filter((r): r is HealthRecord => !!r && typeof r === "object" && typeof r.status === "string" && typeof r.refresh_date === "string" && typeof r.geography_code === "string" && typeof r.geography_name === "string");
  const dates = rows.map(r => Date.parse(r.refresh_date)).filter(Number.isFinite);
  if (dates.length) base.asOf = new Date(Math.max(...dates)).toISOString();
  const current = REGIONS.map(code => rows.filter(r => {
    const age = now.getTime() - Date.parse(r.refresh_date);
    return r.geography_code === code && LEVELS.some(l => l === r.status) && age >= 0 && age <= 24 * 3600_000 &&
      typeof r.period_start === "string" && typeof r.period_end === "string" &&
      Date.parse(r.period_start) <= now.getTime() && Date.parse(r.period_end) > now.getTime();
  }).sort((a,b) => LEVELS.indexOf(b.status as typeof LEVELS[number]) - LEVELS.indexOf(a.status as typeof LEVELS[number]))[0]);
  if (current.some(r => !r)) return base;
  const highest = Math.max(...current.map(r => LEVELS.findIndex(l => l === r?.status)));
  return { ...base, value: LEVELS[highest] ?? null, period: "Current — England", status: "ok",
    sub: "Highest verified regional heat/cold health alert; England only",
    note: "Official UKHSA structured regional records. All nine regions have a filing refreshed within 24 hours and an unexpired validity period. No UK-wide level is implied.",
    scale: base.scale ? { ...base.scale, current: highest } : null };
}

/** Official dashboard proxy documented in UKHSA's frontend api-route-handlers.md. */
export async function checkVerifiedHealthAlerts(read: (url: string) => Promise<string>, now = new Date()): Promise<Metric> {
  async function json(url: string): Promise<unknown> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try { return JSON.parse(await read(url)); } catch { if (attempt === 1) throw new Error("Official alert feed unavailable"); }
    }
    return null;
  }
  try {
    const lists = await Promise.all(["heat", "cold"].map(async kind => {
      const list = await json(`${UKHSA_ALERT_FEED}/${kind}`);
      if (!Array.isArray(list)) throw new Error("Invalid regional feed");
      return Promise.all(list.map(async row => {
        if (!row || !REGIONS.includes(row.geography_code)) return null;
        const age = now.getTime() - Date.parse(row.refresh_date);
        // Old list records retain provenance but cannot establish current status.
        if (!Number.isFinite(age) || age < 0 || age > 24 * 3600_000) return row;
        return json(`${UKHSA_ALERT_FEED}/${kind}/${row.geography_code}`);
      }));
    }));
    return healthAlertMetric(lists.flat(), now);
  } catch {
    return unavailableHealthAlert("The verified official UKHSA structured alert feed could not be read after bounded checks. No current level is assumed; check the official dashboard.");
  }
}
/** Never interpret colour words in navigation or explanatory prose as a current alert. */
export function unavailableHealthAlert(note: string): Metric {
  return {
    id: "uk-health-alerts", category: "National alerts", title: "Weather-health alert level",
    source: "UKHSA / Met Office", sourceUrl: UKHSA_ALERT_URL,
    value: null, sub: "Heat and cold health alerting system, England", period: null,
    asOf: null, nextDue: null, cadence: "Issued through the alerting season, reviewed daily",
    change: null, spark: [], status: "unavailable", note,
    scale: { kind: "ukhsa", authority: "UKHSA · green / yellow / amber / red", current: null,
      steps: [{ label: "Green", tone: "green" }, { label: "Yellow", tone: "yellow" }, { label: "Amber", tone: "amber" }, { label: "Red", tone: "red" }] },
  };
}

export async function checkHealthAlertSource(read: () => Promise<string>): Promise<Metric> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await read();
      return unavailableHealthAlert("The official UKHSA dashboard is reachable, but a documented machine-readable current alert feed has not been verified. Check the official dashboard for regional alerts; no level is assumed.");
    } catch {
      if (attempt === 1) return unavailableHealthAlert("The official UKHSA dashboard could not be reached after two checks. Check the official service directly; no alert level is assumed.");
    }
  }
  return unavailableHealthAlert("No alert level has been verified. Check the official UKHSA dashboard.");
}