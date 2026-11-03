import { PREPAREDNESS, type PreparednessAdvice } from "./preparedness.data";

export const PREPAREDNESS_REGIONS = ["all", "UK", "Europe", "North America", "Oceania"] as const;
export type PreparednessRegion = (typeof PREPAREDNESS_REGIONS)[number];

export function filterPreparedness(region: PreparednessRegion, q: string, list: PreparednessAdvice[] = PREPAREDNESS) {
  const needle = q.trim().toLowerCase();
  return list.filter(a => (region === "all" || a.region === region) &&
    (!needle || `${a.country} ${a.publisher} ${a.quote}`.toLowerCase().includes(needle)));
}
