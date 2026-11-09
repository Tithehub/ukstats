/** Pure horse-racing helpers. Never invent figures: every value here is derived from imported records. */

export type RaceDay = "today" | "tomorrow" | "upcoming";

/** London calendar date (YYYY-MM-DD) for a given instant plus a day offset. */
export function londonDate(now: Date, addDays = 0): string {
  const d = new Date(now.getTime() + addDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Date window [from, to] (inclusive) for each racecard view. Upcoming = the 12 days after tomorrow. */
export function dayWindow(day: RaceDay, now: Date): { from: string; to: string } {
  if (day === "today") { const t = londonDate(now); return { from: t, to: t }; }
  if (day === "tomorrow") { const t = londonDate(now, 1); return { from: t, to: t }; }
  return { from: londonDate(now, 2), to: londonDate(now, 14) };
}

/** A percentage always travels with its sample size; null when there are no runs. */
export function winRate(wins: number, runs: number): { pct: number | null; label: string } {
  if (runs <= 0) return { pct: null, label: "No runs recorded" };
  const pct = Math.round((wins / runs) * 1000) / 10;
  return { pct, label: `${pct}% (${wins} from ${runs} ${runs === 1 ? "run" : "runs"})` };
}

/** 1760 yards to a mile, 220 to a furlong — British racing notation, e.g. 2m4f, 7f, 1m110y. */
export function distanceLabel(yards: number | null | undefined): string {
  if (!yards || yards <= 0) return "Not published";
  const m = Math.floor(yards / 1760), rem = yards - m * 1760;
  const f = Math.floor(rem / 220), y = rem - f * 220;
  return [m ? `${m}m` : "", f ? `${f}f` : "", y ? `${y}y` : ""].join("") || "0f";
}

/** Stones-and-pounds weight, e.g. 154 → 11-0. */
export function weightLabel(lbs: number | null | undefined): string {
  if (!lbs || lbs <= 0) return "—";
  return `${Math.floor(lbs / 14)}-${lbs % 14}`;
}

/** Last N form figures from the official form string, newest last (e.g. "1-23P" → ["2","3","P"]). */
export function lastForm(form: string | null | undefined, n = 5): string[] {
  if (!form) return [];
  return form.replace(/[-/]/g, "").split("").slice(-n);
}

/**
 * Competition odds bonus (Stage 4 rule v1): MIN(10, MAX(0, ROUND(2 × (SP − 2)))).
 * Only a correct winner earns it; points = 10 + bonus. Not a betting recommendation.
 */
export function spBonus(startingPriceDecimal: number): number {
  if (!Number.isFinite(startingPriceDecimal)) return 0;
  return Math.min(10, Math.max(0, Math.round(2 * (startingPriceDecimal - 2))));
}
export function competitionPoints(correct: boolean, sp: number | null, status: "ran" | "non_runner" | "cancelled"): number | null {
  if (status === "cancelled") return null;
  if (status === "non_runner" || !correct) return 0;
  return 10 + (sp == null ? 0 : spBonus(sp));
}
export const SCORING_RULE_VERSION = "v1";
