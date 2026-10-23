import type { BoatDay } from "./small-boats";

const DAY = 86_400_000;

/** Never treat a missing or duplicated day as a zero in a comparable window. */
export function completeBoatWindow(series: BoatDay[], from: string, to: string) {
  const rows = series.filter(row => row.date >= from && row.date <= to);
  const expected = Math.round((Date.parse(to) - Date.parse(from)) / DAY) + 1;
  if (expected < 1 || rows.length !== expected || new Set(rows.map(row => row.date)).size !== expected) return null;
  if (rows.some(row => !Number.isInteger(row.arrivals) || row.arrivals < 0 || !Number.isInteger(row.boats) || row.boats < 0)) return null;
  return { arrivals: rows.reduce((sum, row) => sum + row.arrivals, 0), boats: rows.reduce((sum, row) => sum + row.boats, 0), days: expected };
}

/** Same calendar cutoff for both years; February 29 is excluded from both windows. */
export function compareBoatYears(series: BoatDay[]) {
  const latest = series.at(-1);
  if (!latest) return null;
  const year = Number(latest.date.slice(0, 4));
  const cutoff = latest.date.slice(5) === "02-29" ? "02-28" : latest.date.slice(5);
  const currentTo = `${year}-${cutoff}`;
  const previousTo = `${year - 1}-${cutoff}`;
  const current = completeBoatWindow(series, `${year}-01-01`, currentTo);
  const previous = completeBoatWindow(series, `${year - 1}-01-01`, previousTo);
  return { year, currentTo, previousTo, current, previous, percent: current && previous && previous.arrivals > 0 ? (current.arrivals - previous.arrivals) / previous.arrivals * 100 : null };
}