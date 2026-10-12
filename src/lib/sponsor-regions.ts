// Where a sponsor can appear: "all", a named group, "uk", or a country code.
import { COUNTRIES } from "@/lib/countries";

const EU = COUNTRIES.filter((c) => c.eurostat && !["no", "is", "ch"].includes(c.code)).map((c) => c.code);
const EUROPE = ["uk", ...COUNTRIES.filter((c) => c.wave === 1).map((c) => c.code)];

export const REGION_GROUPS: { id: string; label: string; codes: string[] }[] = [
  { id: "europe", label: "Europe (UK + all European countries)", codes: EUROPE },
  { id: "eu", label: "EU countries", codes: EU },
  { id: "north-america", label: "North America (US, Canada)", codes: ["us", "ca"] },
  { id: "english", label: "English-speaking (UK, US, Canada, Australia, Ireland)", codes: ["uk", "us", "ca", "au", "ie"] },
];

export const PLACE_CODES = ["uk", ...COUNTRIES.map((c) => c.code)];

export function placeName(code: string): string {
  if (code === "all") return "Worldwide";
  if (code === "uk") return "United Kingdom";
  return REGION_GROUPS.find((g) => g.id === code)?.label ?? COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

/** Validates and tidies a sponsor's choices; throws on anything unknown. Empty means worldwide. */
export function normaliseRegions(input: readonly string[]): string[] {
  const out = [...new Set(input.map((s) => String(s).trim().toLowerCase()).filter(Boolean))];
  for (const r of out) {
    if (r !== "all" && !PLACE_CODES.includes(r) && !REGION_GROUPS.some((g) => g.id === r)) throw new Error("Unknown region");
  }
  if (out.length === 0 || out.includes("all")) return ["all"];
  return out;
}

/** Every page code a set of choices covers; "all" stays "all". */
export function expandRegions(regions: readonly string[]): "all" | Set<string> {
  if (regions.length === 0 || regions.includes("all")) return "all";
  const s = new Set<string>();
  for (const r of regions) {
    const g = REGION_GROUPS.find((x) => x.id === r);
    for (const c of g ? g.codes : [r]) s.add(c);
  }
  return s;
}

/** Plain-words summary, e.g. "Every page" or "31 country pages". */
export function reachSummary(regions: readonly string[]): string {
  const e = expandRegions(regions);
  if (e === "all") return "Every page on the site";
  return e.size === 1 ? `1 country's pages (${placeName([...e][0] ?? "")})` : `${e.size} countries' pages`;
}

/** A sponsor row's choices, falling back to the old single region. */
export function rowRegions(row: { regions?: string[] | null; region?: string | null }): string[] {
  if (row.regions && row.regions.length) return row.regions;
  return [row.region || "all"];
}

/** Worldwide / Regional / single-country bucket for the sponsors page. */
export function reachKind(regions: readonly string[]): "Worldwide" | "Regional" | string {
  const e = expandRegions(regions);
  if (e === "all") return "Worldwide";
  return e.size > 1 ? "Regional" : placeName([...e][0] ?? "");
}
