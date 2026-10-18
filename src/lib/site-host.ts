/** Two doors, one site: ukstats.co.uk (UK-first) and stats.solutions (world-first). */
import { COUNTRIES } from "@/lib/countries";

export type Brand = "uk" | "global";

export const SITES: Record<Brand, { origin: string; name: string; tagline: string }> = {
  uk: { origin: "https://ukstats.co.uk", name: "UKStats", tagline: "UK official statistics" },
  global: { origin: "https://stats.solutions", name: "Stats Solutions", tagline: "Official statistics from around the world" },
};

/** Which brand a request host belongs to. Unknown hosts (preview, lovable.app) are UK. */
export function brandFromHost(host: string | null | undefined): Brand {
  const h = (host ?? "").toLowerCase().split(":")[0];
  return h === "stats.solutions" || h.endsWith(".stats.solutions") ? "global" : "uk";
}

const GLOBAL_ROOTS = new Set(["countries", "compare-countries", "gold", "global", "sources"]);
const COUNTRY_CODES = new Set(COUNTRIES.map((c) => c.code));

/** World and non-UK country pages belong to stats.solutions; everything else to ukstats.co.uk. */
export function isGlobalPath(path: string): boolean {
  const first = path.split(/[?#]/)[0].split("/").filter(Boolean)[0] ?? "";
  return GLOBAL_ROOTS.has(first) || COUNTRY_CODES.has(first);
}

export function canonicalFor(path: string): string {
  return `${SITES[isGlobalPath(path) ? "global" : "uk"].origin}${path}`;
}
