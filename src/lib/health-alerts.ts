import type { Metric } from "./uk-stats";

export const UKHSA_ALERT_URL = "https://ukhsa-dashboard.data.gov.uk/weather-health-alerts";
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