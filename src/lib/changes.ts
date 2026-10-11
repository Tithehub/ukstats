// Changes between published observations. Pure arithmetic on published
// values only — returns null when the comparison point was never published.

export interface Point { label: string; value: number }

export interface Comparison {
  label: string;
  fromLabel: string;
  diff: number;
  pct: number | null;
}

/** Find the observation with the same period label N years earlier ("2026 AUG" -> "2016 AUG"). */
function yearsBack(points: Point[], latest: Point, years: number): Point | null {
  const m = latest.label.match(/^(\d{4})(.*)$/);
  if (!m) return null;
  const target = `${Number(m[1]) - years}${m[2]}`;
  return points.find((p) => p.label === target) ?? null;
}

function cmp(label: string, from: Point | null, to: Point): Comparison | null {
  if (!from || !Number.isFinite(from.value) || !Number.isFinite(to.value)) return null;
  const diff = to.value - from.value;
  const pct = from.value !== 0 ? (diff / Math.abs(from.value)) * 100 : null;
  return { label, fromLabel: from.label, diff, pct };
}

export function computeChanges(points: Point[]): Comparison[] {
  if (points.length < 2) return [];
  const latest = points[points.length - 1];
  return [
    cmp("Since previous release", points[points.length - 2], latest),
    cmp("Over 1 year", yearsBack(points, latest, 1), latest),
    cmp("Over 10 years", yearsBack(points, latest, 10), latest),
  ].filter((c): c is Comparison => c !== null);
}
