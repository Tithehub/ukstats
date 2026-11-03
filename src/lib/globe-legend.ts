import { rankIndicator, fmtWorld, type WorldIndicator, type WorldPayload } from "./world";
import { countryKey, type FcdoAlert } from "./unrest";

// Plain WebGL colours; the legend renders the same values so key and globe always agree.
export function shadeColour(s: number): string {
  return `rgba(${Math.round(30 + 200 * s)}, ${Math.round(110 + 80 * s)}, ${Math.round(220 - 150 * s)}, 0.75)`;
}
export const NO_FIGURE = "rgba(140,140,140,0.35)";

export interface StatLayer { fill: Map<string, string>; labels: Map<string, string>; rank: Map<string, { rank: number; of: number; value: string; year: number }>; newest: number | null; ranked: number }

/** Colours, hover labels and ranks for one indicator; stale filings stay grey and unranked. */
export function statLayer(world: WorldPayload, ind: WorldIndicator): StatLayer {
  const rows = rankIndicator(world, ind);
  const ranked = rows.filter((r) => r.rank !== null);
  const n = ranked.length;
  const fill = new Map<string, string>(), labels = new Map<string, string>(), rank: StatLayer["rank"] = new Map();
  for (const r of rows) {
    const k = countryKey(r.country.name), value = fmtWorld(r.value, ind.unit);
    if (r.rank === null) { fill.set(k, NO_FIGURE); labels.set(k, `${r.country.name}: ${value} (${r.year}) — too old to rank`); continue; }
    fill.set(k, shadeColour(n > 1 ? 1 - (r.rank - 1) / (n - 1) : 1));
    labels.set(k, `${r.country.name}: ${value} · rank ${r.rank} of ${n} · ${r.year}`);
    rank.set(k, { rank: r.rank, of: n, value, year: r.year });
  }
  return { fill, labels, rank, newest: rows.length ? Math.max(...rows.map((r) => r.year)) : null, ranked: n };
}

export const US_LEVEL_COLOURS: Record<number, string> = { 1: "rgba(60,170,110,0.75)", 2: "rgba(230,200,60,0.8)", 3: "rgba(240,140,40,0.85)", 4: "rgba(214,60,45,0.9)" };
export const UK_ALERT_COLOURS: Record<FcdoAlert, string> = {
  none: "rgba(60,170,110,0.75)", "parts-essential": "rgba(230,200,60,0.8)", "parts-all": "rgba(240,140,40,0.85)",
  "all-but-essential": "rgba(225,95,45,0.88)", all: "rgba(214,60,45,0.9)",
};
