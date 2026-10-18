// Browser-safe World Bank (World Development Indicators) helpers.
// Values are exactly as the World Bank publishes them; nothing is estimated here.

export const WORLD_CATEGORIES = ["Economy", "People", "Jobs", "Health & safety", "Energy"] as const;
export type WorldCategory = (typeof WORLD_CATEGORIES)[number];

export interface WorldIndicator {
  id: string;
  slug: string;
  label: string;
  unit: "people" | "usd" | "pct" | "rate";
  /** true = a higher value ranks first. */
  higherFirst: boolean;
  note: string;
  category: WorldCategory;
}

const I = (category: WorldCategory, id: string, slug: string, label: string, unit: WorldIndicator["unit"], note: string): WorldIndicator => ({ id, slug, label, unit, higherFirst: true, note, category });

export const WORLD_INDICATORS: WorldIndicator[] = [
  I("People", "SP.POP.TOTL", "population", "Population", "people", "Total population, mid-year."),
  I("Economy", "NY.GDP.MKTP.CD", "gdp", "GDP (US$)", "usd", "Gross domestic product, current US dollars."),
  I("Economy", "NY.GDP.PCAP.CD", "gdp-per-person", "GDP per person (US$)", "usd", "GDP divided by mid-year population, current US dollars."),
  I("Economy", "NY.GDP.MKTP.KD.ZG", "gdp-growth", "Economic growth", "pct", "GDP growth, annual %, constant prices."),
  I("Economy", "FP.CPI.TOTL.ZG", "inflation", "Inflation", "pct", "Consumer prices, annual % change."),
  I("Economy", "GC.DOD.TOTL.GD.ZS", "government-debt", "Government debt (% of GDP)", "pct", "Central government debt, total, % of GDP."),
  I("Economy", "GC.TAX.TOTL.GD.ZS", "tax-revenue", "Tax revenue (% of GDP)", "pct", "Tax revenue collected by central government, % of GDP."),
  I("People", "SP.POP.GROW", "population-growth", "Population growth", "pct", "Population growth, annual %."),
  I("People", "SP.DYN.LE00.IN", "life-expectancy", "Life expectancy (years)", "rate", "Life expectancy at birth, total, years."),
  I("People", "SP.DYN.TFRT.IN", "fertility", "Fertility rate", "rate", "Births per woman."),
  I("People", "SP.URB.TOTL.IN.ZS", "urban", "Urban population (%)", "pct", "Share of people living in urban areas."),
  I("Jobs", "SL.UEM.TOTL.ZS", "unemployment", "Unemployment", "pct", "Unemployment, % of labour force (ILO modelled estimate, as published by the World Bank)."),
  I("Jobs", "SL.UEM.1524.ZS", "youth-unemployment", "Youth unemployment (15–24)", "pct", "Unemployment, % of labour force aged 15–24 (ILO modelled estimate)."),
  I("Jobs", "SL.TLF.CACT.ZS", "labour-participation", "Labour force participation", "pct", "% of people aged 15+ in work or looking for work (ILO modelled estimate)."),
  I("Health & safety", "VC.IHR.PSRC.P5", "homicide", "Homicide rate", "rate", "Intentional homicides per 100,000 people (UNODC)."),
  I("Health & safety", "SP.DYN.IMRT.IN", "infant-mortality", "Infant mortality", "rate", "Deaths before age one per 1,000 live births."),
  I("Health & safety", "SH.XPD.CHEX.GD.ZS", "health-spending", "Health spending (% of GDP)", "pct", "Current health expenditure, % of GDP."),
  I("Health & safety", "SE.XPD.TOTL.GD.ZS", "education-spending", "Education spending (% of GDP)", "pct", "Government expenditure on education, % of GDP."),
  I("Energy", "EN.GHG.CO2.PC.CE.AR5", "co2-per-person", "CO₂ per person (tonnes)", "rate", "CO₂ emissions excluding land use, tonnes per person."),
  I("Energy", "EG.FEC.RNEW.ZS", "renewable-energy", "Renewable energy (%)", "pct", "Renewables share of final energy consumption."),
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
