// Browser-safe World Bank (World Development Indicators) helpers.
// Values are exactly as the World Bank publishes them; nothing is estimated here.

export interface WorldIndicator {
  id: string;
  slug: string;
  label: string;
  unit: "people" | "usd" | "pct" | "rate";
  /** true = a higher value ranks first. */
  higherFirst: boolean;
  note: string;
}

export const WORLD_INDICATORS: WorldIndicator[] = [
  { id: "SP.POP.TOTL", slug: "population", label: "Population", unit: "people", higherFirst: true, note: "Total population, mid-year." },
  { id: "NY.GDP.MKTP.CD", slug: "gdp", label: "GDP (US$)", unit: "usd", higherFirst: true, note: "Gross domestic product, current US dollars." },
  { id: "NY.GDP.PCAP.CD", slug: "gdp-per-person", label: "GDP per person (US$)", unit: "usd", higherFirst: true, note: "GDP divided by mid-year population, current US dollars." },
  { id: "FP.CPI.TOTL.ZG", slug: "inflation", label: "Inflation", unit: "pct", higherFirst: true, note: "Consumer prices, annual % change." },
  { id: "GC.DOD.TOTL.GD.ZS", slug: "government-debt", label: "Government debt (% of GDP)", unit: "pct", higherFirst: true, note: "Central government debt, total, % of GDP." },
  { id: "VC.IHR.PSRC.P5", slug: "homicide", label: "Homicide rate", unit: "rate", higherFirst: true, note: "Intentional homicides per 100,000 people (UNODC)." },
];

export const WORLD_SOURCE = { name: "World Bank — World Development Indicators", url: "https://data.worldbank.org" };
/** Figures older than this many years behind the newest year are shown but not ranked. */
export const MAX_LAG_YEARS = 3;

export interface WorldCountry { iso3: string; iso2: string; name: string; region: string; income: string; capital: string }
export interface WorldValue { value: number; year: number }
export interface WorldPayload {
  countries: WorldCountry[];
  /** indicator id -> iso3 -> latest published value */
  values: Record<string, Record<string, WorldValue>>;
  updated: Record<string, string | null>;
  fetchedAt: string;
}

/** Keeps only real economies; World Bank aggregates (regions, income groups) carry region id "NA". */
export function parseCountries(json: unknown): WorldCountry[] {
  const rows = (Array.isArray(json) ? json[1] : null) as any[] | null;
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => r?.region?.id && r.region.id !== "NA" && r.id)
    .map((r) => ({ iso3: r.id, iso2: r.iso2Code, name: r.name, region: String(r.region.value).trim(), income: String(r.incomeLevel?.value ?? "").trim(), capital: r.capitalCity ?? "" }));
}

export function parseIndicator(json: unknown, keep: Set<string>): { values: Record<string, WorldValue>; updated: string | null } {
  const meta = Array.isArray(json) ? (json[0] as { lastupdated?: string }) : null;
  const rows = (Array.isArray(json) ? json[1] : null) as any[] | null;
  const values: Record<string, WorldValue> = {};
  for (const r of rows ?? []) {
    const iso = r?.countryiso3code;
    if (!keep.has(iso) || typeof r.value !== "number" || !Number.isFinite(r.value)) continue;
    const year = Number(r.date);
    if (!Number.isInteger(year)) continue;
    values[iso] = { value: r.value, year };
  }
  return { values, updated: meta?.lastupdated ?? null };
}

export interface RankedRow { country: WorldCountry; value: number; year: number; rank: number | null }

/** Ranks countries whose figure is recent enough; older figures are listed after, unranked. */
export function rankIndicator(p: WorldPayload, ind: WorldIndicator): RankedRow[] {
  const vals = p.values[ind.id] ?? {};
  const rows: RankedRow[] = p.countries.flatMap((c) => { const v = vals[c.iso3]; return v ? [{ country: c, value: v.value, year: v.year, rank: null }] : []; });
  if (!rows.length) return [];
  const newest = Math.max(...rows.map((r) => r.year));
  const fresh = rows.filter((r) => newest - r.year <= MAX_LAG_YEARS).sort((a, b) => (ind.higherFirst ? b.value - a.value : a.value - b.value));
  fresh.forEach((r, i) => (r.rank = i + 1));
  const old = rows.filter((r) => newest - r.year > MAX_LAG_YEARS).sort((a, b) => a.country.name.localeCompare(b.country.name));
  return [...fresh, ...old];
}

export function fmtWorld(v: number, unit: WorldIndicator["unit"]): string {
  if (unit === "pct") return `${v.toFixed(1)}%`;
  if (unit === "rate") return v.toFixed(1);
  const abs = Math.abs(v);
  const pre = unit === "usd" ? "$" : "";
  if (abs >= 1e12) return `${pre}${(v / 1e12).toFixed(2)}tn`;
  if (abs >= 1e9) return `${pre}${(v / 1e9).toFixed(1)}bn`;
  if (abs >= 1e6) return `${pre}${(v / 1e6).toFixed(1)}m`;
  return `${pre}${Math.round(v).toLocaleString("en-GB")}`;
}

export const indicatorBySlug = (s: string | undefined) => WORLD_INDICATORS.find((i) => i.slug === s) ?? WORLD_INDICATORS[0]!;
