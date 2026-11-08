/**
 * Happiest and saddest countries — pure helpers. Two lists are kept apart and never merged:
 * "official" (Eurostat EU-SILC overall life satisfaction, 0–10) and "research"
 * (World Happiness Report Cantril ladder, 0–10, Gallup polling).
 */
import { parseByGeo, type JsonStat } from "./eurostat";

export const WORLD_WELLBEING_CACHE_ID = "world-wellbeing-v1";
/** Entries more than this many years behind the newest in their list are shown but not ranked. */
export const STALE_YEARS = 3;

export type CountryScore = { id: string; name: string; score: number | null; year: number | null; ranked: boolean };
export type WellbeingList = {
  kind: "official" | "research";
  source: { name: string; url: string; period: string; published?: string | null };
  rows: CountryScore[];
};
export type WorldWellbeingPayload = { fetchedAt: string; official: WellbeingList | null; research: WellbeingList; errors: string[] };

const AGGREGATES = /^(EU|EA)/;

/** Latest published year per country from Eurostat ilc_pw01. Aggregates skipped; missing stays null. */
export function parseEurostatLifeSat(js: JsonStat & { dimension: Record<string, { category: { label?: Record<string, string> } }> }): CountryScore[] {
  const series = parseByGeo(js);
  const labels = js.dimension["geo"]?.category.label ?? {};
  const rows: CountryScore[] = [];
  for (const [geo, s] of Object.entries(series)) {
    if (AGGREGATES.test(geo)) continue;
    const last = s.points[s.points.length - 1];
    rows.push({ id: geo, name: (labels[geo] ?? geo).replace(/\*$/, ""), score: last?.value ?? null, year: last ? Number(last.time) : null, ranked: false });
  }
  return markRanked(rows);
}

/** Ranked only when a score exists and is within STALE_YEARS of the newest year in the list. */
export function markRanked(rows: CountryScore[]): CountryScore[] {
  const newest = Math.max(...rows.map((r) => r.year ?? -Infinity));
  return rows.map((r) => ({ ...r, ranked: r.score != null && r.year != null && newest - r.year <= STALE_YEARS }));
}

/** Ranks ranked rows; ties share a position. Unranked rows are excluded. */
export function rankCountries(rows: CountryScore[], best: boolean): (CountryScore & { position: number })[] {
  const sorted = rows.filter((r) => r.ranked && r.score != null).sort((a, b) => (best ? b.score! - a.score! : a.score! - b.score!) || a.name.localeCompare(b.name));
  let pos = 0;
  return sorted.map((r, i) => {
    if (i === 0 || r.score !== sorted[i - 1]!.score) pos = i + 1;
    return { ...r, position: pos };
  });
}
