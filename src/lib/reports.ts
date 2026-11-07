// Pure rules for paid PDF reports: prices, what each purchase unlocks.
// Figures inside the reports are never created here — see report-pdf.server.ts.

export type ReportEdition = "uk" | "global";
export type ReportKind = "daily" | "weekly" | "monthly";

export const REPORT_PRICES = {
  report_uk_daily: { edition: "uk", pence: 100, interval: null, label: "Daily UK report" },
  report_global_daily: { edition: "global", pence: 250, interval: null, label: "Daily Global report" },
  report_uk_monthly: { edition: "uk", pence: 1999, interval: "month", label: "UK reports — monthly" },
  report_uk_yearly: { edition: "uk", pence: 19900, interval: "year", label: "UK reports — yearly" },
  report_global_monthly: { edition: "global", pence: 4999, interval: "month", label: "Global reports — monthly" },
  report_global_yearly: { edition: "global", pence: 49900, interval: "year", label: "Global reports — yearly" },
} as const satisfies Record<string, { edition: ReportEdition; pence: number; interval: "month" | "year" | null; label: string }>;

export type ReportPriceId = keyof typeof REPORT_PRICES;
export const isReportPriceId = (s: unknown): s is ReportPriceId => typeof s === "string" && s in REPORT_PRICES;

export const gbp = (pence: number) => `£${(pence / 100).toFixed(2)}`;

/** What the same downloads would cost bought one day at a time. */
export function dailyEquivalent(edition: ReportEdition, interval: "month" | "year"): number {
  const day = edition === "uk" ? 100 : 250;
  return day * (interval === "month" ? 30 : 365);
}

export function savingPercent(id: ReportPriceId): number {
  const p = REPORT_PRICES[id];
  if (!p.interval) return 0;
  return Math.round((1 - p.pence / dailyEquivalent(p.edition, p.interval)) * 100);
}

export interface ReportPurchase { edition: ReportEdition; report_date: string }
export interface ReportSub { edition: ReportEdition; status: string; current_period_start: string | null; current_period_end: string | null }

const covers = (owned: ReportEdition, wanted: ReportEdition) => owned === "global" || owned === wanted;

/** Subscriptions keep access until their paid period ends, including after cancelling. */
export function subActive(s: ReportSub, now: Date): boolean {
  const end = s.current_period_end ? new Date(s.current_period_end) : null;
  if (["active", "trialing", "past_due"].includes(s.status)) return !end || end > now;
  if (s.status === "canceled") return !!end && end > now;
  return false;
}

/**
 * Can this buyer download this report? A single-day purchase unlocks that day's
 * daily report only (Global includes the UK edition). An active subscription
 * unlocks every report of its edition, daily, weekly and monthly.
 */
export function canDownload(
  want: { edition: ReportEdition; kind: ReportKind; date: string },
  purchases: ReportPurchase[],
  subs: ReportSub[],
  now: Date = new Date(),
): boolean {
  if (subs.some((s) => covers(s.edition, want.edition) && subActive(s, now))) return true;
  if (want.kind !== "daily") return false;
  return purchases.some((p) => p.report_date === want.date && covers(p.edition, want.edition));
}

export const reportPath = (edition: ReportEdition, kind: ReportKind, date: string) => `${edition}/${kind}/${date}.pdf`;
export const reportFileName = (edition: ReportEdition, kind: ReportKind, date: string) =>
  `UKStats-${edition === "uk" ? "UK" : "Global"}-${kind}-report-${date}.pdf`;

/** Which editions to build on a London date: daily always, weekly on Mondays, monthly on the 1st. */
export function kindsFor(date: string): ReportKind[] {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
  return ["daily", ...(dow === 1 ? (["weekly"] as const) : []), ...(d === 1 ? (["monthly"] as const) : [])];
}

/** Earliest publication date a weekly/monthly edition looks back to. */
export function windowStart(date: string, kind: ReportKind): string {
  const t = new Date(`${date}T00:00:00Z`);
  if (kind === "weekly") t.setUTCDate(t.getUTCDate() - 7);
  else if (kind === "monthly") t.setUTCMonth(t.getUTCMonth() - 1);
  else t.setUTCDate(t.getUTCDate() - 1);
  return t.toISOString().slice(0, 10);
}
