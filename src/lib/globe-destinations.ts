// Pure map from a globe country to the pages UKStats genuinely has for it.
// A destination is listed only when the page exists for that country.
import { COUNTRIES } from "@/lib/countries";
import { CRIME_COVERAGE } from "@/lib/city-crime";
import { PREPAREDNESS } from "@/lib/preparedness.data";

export type Destination =
  | { kind: "uk-register" | "uk-small-boats" | "uk-parties" | "uk-polling" | "uk-maps" | "uk-preparedness"; label: string }
  | { kind: "country-stats"; label: string; code: string }
  | { kind: "safest"; label: string; code: string }
  | { kind: "world-profile"; label: string; iso: string }
  | { kind: "world-compare"; label: string; countries: string }
  | { kind: "preparedness"; label: string; q: string };

export function countryDestinations(iso2: string, iso3: string | null, name: string): Destination[] {
  const code = iso2.toLowerCase();
  const isUk = code === "gb" || code === "uk";
  const out: Destination[] = [];
  if (isUk) {
    out.push(
      { kind: "uk-register", label: "All UK statistics" },
      { kind: "uk-small-boats", label: "Small boats since 2018" },
      { kind: "safest", label: "Safest & least safe places", code: "uk" },
      { kind: "uk-maps", label: "UK maps" },
      { kind: "uk-parties", label: "Political parties" },
      { kind: "uk-polling", label: "Polling" },
      { kind: "uk-preparedness", label: "Emergency preparedness" },
    );
  } else {
    if (COUNTRIES.some((c) => c.code === code)) out.push({ kind: "country-stats", label: `${name} statistics`, code });
    if (CRIME_COVERAGE.includes(code)) out.push({ kind: "safest", label: "Safest & least safe places", code });
    if (PREPAREDNESS.some((p) => p.code === iso2.toUpperCase())) out.push({ kind: "preparedness", label: "Official preparedness advice", q: name });
  }
  if (iso3) {
    out.push({ kind: "world-profile", label: "World ranking profile", iso: iso3.toLowerCase() });
    out.push({ kind: "world-compare", label: isUk ? "Compare with France & US" : "Compare with the UK", countries: isUk ? "GBR,FRA,USA" : `GBR,${iso3.toUpperCase()}` });
  }
  return out;
}
