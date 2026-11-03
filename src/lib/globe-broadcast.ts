// Pure helpers for the globe's "news programme" mode. No figures are created here:
// segments only reference figures, warnings and videos that already exist.

export type SegmentKind = "stats" | "warnings" | "news";
export const SEGMENT_MS = 8000;
export const UK_KEY = "united kingdom";

/** UK first, then countries with official warnings (newest first), then the rest in the given order. Unique keys. */
export function buildRunningOrder(countries: string[], warnings: { key: string; updated: string | null }[]): string[] {
  const latest = new Map<string, number>();
  for (const w of warnings) {
    const t = w.updated ? Date.parse(w.updated) : NaN;
    if (!Number.isFinite(t)) continue;
    latest.set(w.key, Math.max(latest.get(w.key) ?? -Infinity, t));
  }
  const warned = [...latest.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k]) => k);
  const out: string[] = [], seen = new Set<string>();
  for (const k of [UK_KEY, ...warned, ...countries]) if (k && !seen.has(k)) { seen.add(k); out.push(k); }
  return out;
}

/** Segments that have something to show; warnings segment always shows (it states "no current warning"). */
export function buildSegments(c: { hasStats: boolean; warningCount: number; videoCount: number }): SegmentKind[] {
  const s: SegmentKind[] = [];
  if (c.hasStats) s.push("stats");
  s.push("warnings");
  if (c.videoCount > 0) s.push("news");
  return s;
}

/** The country after `current`; a country not in the list resumes from the start. */
export function nextInOrder(order: string[], current: string, step = 1): string | null {
  if (!order.length) return null;
  const i = order.indexOf(current);
  if (i < 0) return order[0]!;
  return order[(i + step + order.length) % order.length]!;
}
