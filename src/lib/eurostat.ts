// Pure Eurostat JSON-stat 2.0 parsing + dataset definitions (no network).
import type { Category } from "@/lib/uk-stats";

export interface EsDef {
  id: string;
  title: string;
  dataset: string;
  params: Record<string, string>;
  cadence: string;
  fmt: (v: number) => string;
  note?: string;
  category?: Category;
}

const pct = (v: number) => `${v.toFixed(1)}%`;

export const ES_DEFS: EsDef[] = [
  { id: "hicp", title: "Inflation (HICP, annual rate)", dataset: "prc_hicp_manr", params: { coicop: "CP00", unit: "RCH_A" }, cadence: "Monthly", fmt: pct },
  { id: "unemployment", title: "Unemployment rate", dataset: "une_rt_m", params: { s_adj: "SA", age: "TOTAL", sex: "T", unit: "PC_ACT" }, cadence: "Monthly", fmt: pct },
  { id: "gdp-growth", title: "GDP growth (quarter on quarter)", dataset: "namq_10_gdp", params: { unit: "CLV_PCH_PRE", s_adj: "SCA", na_item: "B1GQ" }, cadence: "Quarterly", fmt: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%` },
  { id: "debt", title: "Government debt (% of GDP)", dataset: "gov_10q_ggdebt", params: { unit: "PC_GDP", sector: "S13", na_item: "GD" }, cadence: "Quarterly", fmt: pct },
  { id: "deficit", title: "Government deficit (−) / surplus (% of GDP)", dataset: "gov_10q_ggnfa", params: { unit: "PC_GDP", sector: "S13", na_item: "B9", s_adj: "NSA" }, cadence: "Quarterly", fmt: pct },
  { id: "house-prices", title: "House prices (annual change)", dataset: "prc_hpi_q", params: { purchase: "TOTAL", unit: "RCH_A" }, cadence: "Quarterly", fmt: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%` },
  { id: "asylum", title: "First-time asylum applicants (month)", dataset: "migr_asyappctzm", params: { citizen: "TOTAL", sex: "T", age: "TOTAL", applicant: "FRST", unit: "PER" }, cadence: "Monthly", fmt: (v) => Math.round(v).toLocaleString("en-GB") },
  { id: "irregular-present", title: "Found to be illegally present (year)", dataset: "migr_eipre", params: { citizen: "TOTAL", reason: "TOTAL", apprehen: "TOTAL", sex: "T", age: "TOTAL", unit: "PER" }, cadence: "Yearly", fmt: (v) => Math.round(v).toLocaleString("en-GB"), note: "Non-EU citizens found illegally present, incl. illegal entries and overstays." },
  { id: "ordered-to-leave", title: "Ordered to leave (year)", dataset: "migr_eiord", params: { citizen: "TOTAL", sex: "T", age: "TOTAL", unit: "PER" }, cadence: "Yearly", fmt: (v) => Math.round(v).toLocaleString("en-GB"), note: "Non-EU citizens issued an order to leave the country." },
  { id: "returned", title: "Returned following an order to leave (year)", dataset: "migr_eirtn", params: { citizen: "TOTAL", c_dest: "TOTAL", sex: "T", age: "TOTAL", unit: "PER" }, cadence: "Yearly", fmt: (v) => Math.round(v).toLocaleString("en-GB"), note: "Non-EU citizens returned to any destination after an order to leave." },
  { id: "min-wage", title: "Monthly minimum wage (EUR)", dataset: "earn_mw_cur", params: { currency: "EUR" }, cadence: "Twice a year", fmt: (v) => `€${v.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`, note: "Countries without a national statutory minimum wage show no figure." },
  { id: "population", title: "Population (1 January)", dataset: "tps00001", params: {}, cadence: "Yearly", fmt: (v) => Math.round(v).toLocaleString("en-GB") },
  { id: "debt-eur", title: "Government debt (EUR)", dataset: "gov_10q_ggdebt", params: { unit: "MIO_EUR", sector: "S13", na_item: "GD" }, cadence: "Quarterly", fmt: (v) => `€${v.toLocaleString("en-GB", { maximumFractionDigits: 1 })} million`, category: "Finance", note: "General government consolidated gross debt; Eurostat publishes this series in millions of euros, including for non-euro countries." },
  { id: "asylum-decisions", title: "First-instance asylum decisions", dataset: "migr_asydcfsta", params: { citizen: "TOTAL", sex: "T", age: "TOTAL", decision: "TOTAL", unit: "PER" }, cadence: "Yearly", fmt: (v) => v.toLocaleString("en-GB"), category: "Immigration", note: "All first-instance decisions, not just grants of protection. Not equivalent to applications or irregular arrivals." },
  { id: "residence-permits", title: "First residence permits issued", dataset: "migr_resfirst", params: { citizen: "TOTAL", reason: "TOTAL", duration: "TOTAL", unit: "PER" }, cadence: "Yearly", fmt: (v) => v.toLocaleString("en-GB"), category: "Immigration", note: "First permits issued to non-EU citizens, for all reasons and durations. These are lawful residence permissions, not irregular migration." },
  { id: "homicide", title: "Police-recorded intentional homicide", dataset: "crim_off_cat", params: { iccs: "ICCS0101", unit: "NR" }, cadence: "Yearly", fmt: (v) => v.toLocaleString("en-GB"), category: "Crime", note: "Police-recorded offences classified under ICCS. Legal definitions and recording practices differ between countries; counts are not population-adjusted." },
  { id: "doctors", title: "Practising doctors per 100,000 people", dataset: "hlth_rs_prs1", params: { wstatus: "PRACT", unit: "P_HTHAB", isco08: "OC221" }, cadence: "Yearly", fmt: (v) => v.toLocaleString("en-GB", { maximumFractionDigits: 2 }), category: "NHS & doctors", note: "Practising medical doctors, not a national doctors' register total. Coverage varies by reporting country." },
  { id: "health-spend", title: "Government health spending (% of GDP)", dataset: "gov_10a_exp", params: { unit: "PC_GDP", sector: "S13", cofog99: "GF07", na_item: "TE" }, cadence: "Yearly", fmt: pct, category: "NHS & doctors", note: "General government expenditure classified as health (COFOG); not total public and private health spending." },
  { id: "defence-spend", title: "Government defence spending (% of GDP)", dataset: "gov_10a_exp", params: { unit: "PC_GDP", sector: "S13", cofog99: "GF02", na_item: "TE" }, cadence: "Yearly", fmt: pct, category: "Defence & security", note: "COFOG general government defence expenditure. This is not NATO's defence spending definition." },
  { id: "social-protection", title: "Government social protection spending (% of GDP)", dataset: "gov_10a_exp", params: { unit: "PC_GDP", sector: "S13", cofog99: "GF10", na_item: "TE" }, cadence: "Yearly", fmt: pct, category: "Finance", note: "COFOG social protection expenditure, including pensions. Not equivalent to the UK benefits bill." },
  ...[
    ["food-inflation", "Food and non-alcoholic drinks inflation", "CP01"],
    ["electricity-inflation", "Electricity inflation", "CP0451"],
    ["gas-inflation", "Gas inflation", "CP0452"],
    ["rent-inflation", "Actual rents inflation", "CP041"],
    ["transport-inflation", "Transport inflation", "CP07"],
    ["communications-inflation", "Communications inflation", "CP08"],
  ].map(([id, title, coicop]) => ({ id: id ?? "", title: title ?? "", dataset: "prc_hicp_manr", params: { coicop: coicop ?? "", unit: "RCH_A" }, cadence: "Monthly", fmt: pct, category: "Cost of living" as Category, note: "Annual HICP price change for this category; not a cash bill, price level or household spending estimate." })),
];

export interface JsonStat {
  id: string[];
  size: number[];
  value: Record<string, number> | number[];
  updated?: string;
  dimension: Record<string, { category: { index: Record<string, number> | string[] } }>;
}

export interface GeoSeries {
  /** time label -> value, in time order; only published values. */
  points: { time: string; value: number }[];
}

const indexMap = (idx: Record<string, number> | string[]): Record<string, number> =>
  Array.isArray(idx) ? Object.fromEntries(idx.map((k, i) => [k, i])) : idx;

/** Split a JSON-stat dataset into per-geo series. Missing cells are skipped, never filled. */
export function parseByGeo(js: JsonStat): Record<string, GeoSeries> {
  const strides: number[] = [];
  let s = 1;
  for (let i = js.size.length - 1; i >= 0; i--) {
    strides[i] = s;
    s *= js.size[i] ?? 1;
  }
  const gi = js.id.indexOf("geo");
  const ti = js.id.indexOf("time");
  if (gi < 0 || ti < 0) return {};
  // Only accept datasets filtered down to a single cell on every other dimension.
  for (let i = 0; i < js.size.length; i++) if (i !== gi && i !== ti && js.size[i] !== 1) return {};
  const geoDimension = js.dimension["geo"], timeDimension = js.dimension["time"];
  if (!geoDimension || !timeDimension) return {};
  const geos = indexMap(geoDimension.category.index);
  const times = Object.entries(indexMap(timeDimension.category.index)).sort((a, b) => a[0].localeCompare(b[0]));
  const out: Record<string, GeoSeries> = {};
  for (const [geo, g] of Object.entries(geos)) {
    const points: GeoSeries["points"] = [];
    for (const [time, t] of times) {
      const v = (js.value as Record<string, number>)[String(g * (strides[gi] ?? 0) + t * (strides[ti] ?? 0))];
      if (typeof v === "number" && Number.isFinite(v)) points.push({ time, value: v });
    }
    out[geo] = { points };
  }
  return out;
}
