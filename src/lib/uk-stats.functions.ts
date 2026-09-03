import { createServerFn } from "@tanstack/react-start";
import type { HistoryPayload, Metric, StatsPayload } from "./uk-stats";

const UA = { "user-agent": "uk-national-data-register/1.0 (+aggregator)" };

/** Caps concurrent requests to one host; ONS rate-limits bursts with HTTP 429. */
function makeGate(limit: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= limit) await new Promise<void>((r) => queue.push(r));
    active++;
    try {
      return await fn();
    } finally {
      active--;
      queue.shift()?.();
    }
  };
}
const onsGate = makeGate(2);
let lastOns = 0;
/** Minimum spacing between ONS requests, on top of the concurrency cap. */
async function onsSpace() {
  const gap = 220;
  const now = Date.now();
  const waitFor = Math.max(0, lastOns + gap - now);
  lastOns = now + waitFor;
  if (waitFor) await new Promise((r) => setTimeout(r, waitFor));
}

async function getJson<T>(url: string, ms = 20_000): Promise<T> {
  const run = async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { headers: { accept: "application/json", ...UA }, signal: ctrl.signal });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return (await res.json()) as T;
    } finally {
      clearTimeout(t);
    }
  };
  if (!/ons\.gov\.uk/.test(url)) return run();
  return onsGate(async () => {
    await onsSpace();
    return run();
  });
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** ONS rate-limits bursts with HTTP 429; retry with backoff before giving up on the feed. */
async function retrying<T>(fn: () => Promise<T>, attempts = 6): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!/\b429\b/.test(String(e)) || i === attempts - 1) throw e;
      await wait(1_200 * (i + 1) + Math.floor(Math.random() * 600));
    }
  }
  throw last;
}

/* ------------------------------ ONS time series ----------------------------- */

interface OnsPoint {
  date: string;
  value: string;
  label: string;
  updateDate: string;
}
interface OnsSeries {
  description: { title: string; date: string };
  months?: OnsPoint[];
  quarters?: OnsPoint[];
  years?: OnsPoint[];
}

const releaseCache = new Map<string, Promise<string | null>>();

async function onsNextRelease(query: string): Promise<string | null> {
  const hit = releaseCache.get(query);
  if (hit) return hit;
  const p = (async () => {
    try {
      const data = await getJson<{
        releases: { description: { title: string; release_date: string; cancelled: boolean } }[];
      }>(
        `https://api.beta.ons.gov.uk/v1/search/releases?query=${encodeURIComponent(query)}&release-type=type-upcoming&limit=20`,
      );
      const dates = (data.releases ?? [])
        .filter((r) => !r.description.cancelled)
        .map((r) => r.description.release_date)
        .filter(Boolean)
        .sort();
      return dates[0] ?? null;
    } catch {
      return null;
    }
  })();
  releaseCache.set(query, p);
  return p;
}

export interface OnsDef {
  id: string;
  category: Metric["category"];
  subcategory?: string;
  title: string;
  uri: string;
  releaseQuery: string;
  cadence: string;
  format: (v: number) => string;
  changeUnit: string;
  /** Overrides the default change wording, e.g. for counts of people. */
  changeFormat?: (delta: number) => string;
  sub?: string;
  frequency?: "months" | "quarters" | "years";
  /** Axis unit used on the full-history chart. */
  unit?: string;
}

/** Short-lived cache of published series; the publisher revises at most daily. */
const seriesCache = new Map<string, { at: number; data: Promise<OnsSeries> }>();
const SERIES_TTL = 10 * 60_000;

async function onsSeries(uri: string): Promise<OnsSeries> {
  const hit = seriesCache.get(uri);
  if (hit && Date.now() - hit.at < SERIES_TTL) return hit.data;
  const data = retrying(() => getJson<OnsSeries>(`https://api.beta.ons.gov.uk/v1/data?uri=${uri}`));
  seriesCache.set(uri, { at: Date.now(), data });
  data.catch(() => seriesCache.delete(uri));
  return data;
}

function onsPoints(series: OnsSeries, frequency?: "months" | "quarters" | "years") {
  const freq = frequency ?? "months";
  return (series[freq] ?? series.quarters ?? series.years ?? []).filter((p) => p.value !== "");
}

async function onsMetric(opts: OnsDef): Promise<Metric> {
  const base: Metric = {
    id: opts.id,
    category: opts.category,
    subcategory: opts.subcategory ?? null,
    title: opts.title,
    source: "Office for National Statistics",
    sourceUrl: `https://www.ons.gov.uk${opts.uri}`,
    value: null,
    sub: opts.sub ?? null,
    period: null,
    asOf: null,
    nextDue: null,
    cadence: opts.cadence,
    change: null,
    spark: [],
    status: "unavailable",
    note: null,
    hasHistory: true,
  };
  try {
    const [series, nextDue] = await Promise.all([onsSeries(opts.uri), onsNextRelease(opts.releaseQuery)]);
    const points = onsPoints(series, opts.frequency);
    const last = points[points.length - 1];
    if (!last) return { ...base, note: "Source returned no observations.", hasHistory: false };
    const prev = points[points.length - 2];
    const v = Number(last.value);
    const pv = prev ? Number(prev.value) : null;
    const delta = pv === null ? null : v - pv;
    return {
      ...base,
      value: opts.format(v),
      period: last.label,
      asOf: last.updateDate ?? null,
      nextDue,
      spark: points.slice(-14).map((p) => Number(p.value)),
      historyFrom: points[0]?.label ?? null,
      historyPoints: points.length,
      change:
        delta === null
          ? null
          : {
              label: opts.changeFormat
                ? opts.changeFormat(delta)
                : `${delta > 0 ? "▲" : delta < 0 ? "▼" : "■"} ${Math.abs(delta).toFixed(1)}${opts.changeUnit} vs previous`,
              dir: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
            },
      status: "ok",
    };
  } catch (e) {
    return { ...base, note: `Source unreachable: ${(e as Error).message}`, hasHistory: false };
  }
}

const pct = (v: number) => `${v.toFixed(1)}%`;
const idx = (v: number) => v.toFixed(1);
const CPI_RELEASE = "Consumer price inflation";
const CPI_CADENCE = "Monthly, mid-month";
const mm23 = (code: string) => `/economy/inflationandpriceindices/timeseries/${code}/mm23`;

/**
 * Every ONS time series this service reproduces. Values, periods and revision
 * dates all come straight from the published series; nothing is recalculated.
 */
export const ONS_DEFS: OnsDef[] = [
  {
    id: "uk-national-debt",
    category: "Finance",
    title: "UK public sector net debt",
    uri: "/economy/governmentpublicsectorandtaxes/publicsectorfinance/timeseries/hf6w/pusf",
    releaseQuery: "Public sector finances",
    cadence: "Monthly, around the 21st",
    format: (v) => `£${v.toLocaleString("en-GB", { maximumFractionDigits: 1 })}bn`,
    changeUnit: "bn",
    unit: "£bn",
    sub: "Excluding public sector banks, not seasonally adjusted",
  },
  {
    id: "uk-debt-gdp",
    category: "Finance",
    title: "Net debt as a share of GDP",
    uri: "/economy/governmentpublicsectorandtaxes/publicsectorfinance/timeseries/hf6x/pusf",
    releaseQuery: "Public sector finances",
    cadence: "Monthly, around the 21st",
    format: pct,
    changeUnit: "pp",
    unit: "% of GDP",
    sub: "Excluding public sector banks",
  },
  {
    id: "uk-unemployment",
    category: "Finance",
    title: "Unemployment rate",
    uri: "/employmentandlabourmarket/peoplenotinwork/unemployment/timeseries/mgsx/lms",
    releaseQuery: "Labour market overview",
    cadence: "Monthly, rolling three-month estimate",
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "Aged 16 and over, seasonally adjusted",
  },
  {
    id: "uk-gdp",
    category: "Finance",
    title: "GDP growth, quarter on quarter",
    uri: "/economy/grossdomesticproductgdp/timeseries/ihyq/pn2",
    releaseQuery: "GDP quarterly national accounts",
    cadence: "Quarterly",
    format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`,
    changeUnit: "pp",
    unit: "%",
    sub: "Chained volume measure, seasonally adjusted",
    frequency: "quarters",
  },

  /* ---- Cost of living: headline ---- */
  {
    id: "uk-cpi",
    category: "Cost of living",
    subcategory: "Headline inflation",
    title: "CPI inflation, annual rate",
    uri: mm23("d7g7"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "All items, 12-month rate",
  },
  {
    id: "uk-cpih",
    category: "Cost of living",
    subcategory: "Headline inflation",
    title: "CPIH inflation, annual rate",
    uri: mm23("l55o"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "All items including owner occupiers' housing costs",
  },

  /* ---- Household shopping ---- */
  {
    id: "uk-cpi-food",
    category: "Cost of living",
    subcategory: "Household shopping",
    title: "Food and non-alcoholic drinks",
    uri: mm23("d7g8"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPI annual rate, division 01",
  },
  {
    id: "uk-cpi-alcohol-tobacco",
    category: "Cost of living",
    subcategory: "Household shopping",
    title: "Alcohol and tobacco",
    uri: mm23("d7g9"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPI annual rate, division 02",
  },
  {
    id: "uk-cpi-clothing",
    category: "Cost of living",
    subcategory: "Household shopping",
    title: "Clothing and footwear",
    uri: mm23("d7ga"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPI annual rate, division 03",
  },
  {
    id: "uk-cpi-household-goods",
    category: "Cost of living",
    subcategory: "Household shopping",
    title: "Furniture and household equipment",
    uri: mm23("d7gc"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPI annual rate, division 05",
  },
  {
    id: "uk-cpi-restaurants",
    category: "Cost of living",
    subcategory: "Household shopping",
    title: "Restaurants, cafés and hotels",
    uri: mm23("d7gi"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPI annual rate, division 11",
  },

  /* ---- Energy & fuel ---- */
  {
    id: "uk-cpi-electricity",
    category: "Cost of living",
    subcategory: "Energy & fuel",
    title: "Electricity prices",
    uri: mm23("d7i7"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPI annual rate, class 04.5.1",
  },
  {
    id: "uk-cpi-gas",
    category: "Cost of living",
    subcategory: "Energy & fuel",
    title: "Gas prices",
    uri: mm23("d7i8"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPI annual rate, class 04.5.2",
  },
  {
    id: "uk-cpi-motor-fuels",
    category: "Cost of living",
    subcategory: "Energy & fuel",
    title: "Motor fuels and lubricants",
    uri: mm23("d7io"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPI annual rate, class 07.2.2",
  },
  {
    id: "uk-cpi-housing-fuels",
    category: "Cost of living",
    subcategory: "Energy & fuel",
    title: "Housing, water and fuels",
    uri: mm23("d7gb"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPI annual rate, division 04",
  },

  /* ---- Council tax ---- */
  {
    id: "uk-council-tax-rate",
    category: "Cost of living",
    subcategory: "Council tax",
    title: "Council tax and rates, annual rate",
    uri: mm23("dhyu"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPIH annual rate, class 04.9",
  },
  {
    id: "uk-council-tax-index",
    category: "Cost of living",
    subcategory: "Council tax",
    title: "Council tax and rates, price index",
    uri: mm23("dhyr"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: idx,
    changeUnit: " pts",
    unit: "index, 2015 = 100",
    sub: "CPIH index, class 04.9 (2015 = 100)",
  },

  /* ---- Telephone & internet ---- */
  {
    id: "uk-cpi-communication",
    category: "Cost of living",
    subcategory: "Telephone & internet",
    title: "Communication services",
    uri: mm23("d7gf"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPI annual rate, division 08",
  },
  {
    id: "uk-cpi-mobile-services",
    category: "Cost of living",
    subcategory: "Telephone & internet",
    title: "Wireless telephone services, price index",
    uri: mm23("l7gi"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: idx,
    changeUnit: " pts",
    unit: "index, 2015 = 100",
    sub: "CPI index, class 08.3.0.2 (2015 = 100)",
  },
  {
    id: "uk-cpi-fixed-telephone",
    category: "Cost of living",
    subcategory: "Telephone & internet",
    title: "Fixed telephone equipment, price index",
    uri: mm23("l7ge"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: idx,
    changeUnit: " pts",
    unit: "index, 2015 = 100",
    sub: "CPI index, class 08.2.0.1 (2015 = 100)",
  },

  /* ---- Water & sewerage ---- */
  {
    id: "uk-cpi-water",
    category: "Cost of living",
    subcategory: "Water & sewerage",
    title: "Water supply",
    uri: mm23("d7i5"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPI annual rate, class 04.4.1",
  },
  {
    id: "uk-cpi-sewerage",
    category: "Cost of living",
    subcategory: "Water & sewerage",
    title: "Sewerage collection",
    uri: mm23("d7i4"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPI annual rate, class 04.4.3",
  },

  /* ---- House prices & rents ---- */
  {
    id: "uk-cpi-rents",
    category: "Cost of living",
    subcategory: "House prices & rents",
    title: "Actual rents for housing",
    uri: mm23("d7gq"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPI annual rate, group 04.1",
  },

  /* ---- Travel costs ---- */
  {
    id: "uk-cpi-transport",
    category: "Cost of living",
    subcategory: "Travel costs",
    title: "Transport, all items",
    uri: mm23("d7ge"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPI annual rate, division 07",
  },
  {
    id: "uk-cpi-rail",
    category: "Cost of living",
    subcategory: "Travel costs",
    title: "Passenger transport by railway",
    uri: mm23("d7ir"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPI annual rate, class 07.3.1",
  },
  {
    id: "uk-cpi-road-transport",
    category: "Cost of living",
    subcategory: "Travel costs",
    title: "Passenger transport by road",
    uri: mm23("d7is"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPI annual rate, classes 07.3.2 and 07.3.6",
  },
  {
    id: "uk-cpi-air",
    category: "Cost of living",
    subcategory: "Travel costs",
    title: "Passenger transport by air",
    uri: mm23("d7it"),
    releaseQuery: CPI_RELEASE,
    cadence: CPI_CADENCE,
    format: pct,
    changeUnit: "pp",
    unit: "%",
    sub: "CPI annual rate, class 07.3.3",
  },

  /* ---- Wages ---- */
  {
    id: "uk-average-weekly-earnings",
    category: "Cost of living",
    subcategory: "Wages",
    title: "Average weekly earnings, total pay",
    uri: "/employmentandlabourmarket/peopleinwork/earningsandworkinghours/timeseries/kab9/lms",
    releaseQuery: "Labour market overview",
    cadence: "Monthly, with the labour market release",
    format: (v) => `£${v.toLocaleString("en-GB")}`,
    changeUnit: "",
    unit: "£ per week",
    sub: "Whole economy, seasonally adjusted, excluding arrears",
  },

  /* ---- Population ---- */
  {
    id: "uk-population",
    category: "Population & migration",
    subcategory: "Population",
    title: "UK resident population",
    uri: "/peoplepopulationandcommunity/populationandmigration/populationestimates/timeseries/ukpop/pop",
    releaseQuery: "Population estimates for the UK",
    cadence: "Annual mid-year estimate",
    format: (v) => v.toLocaleString("en-GB"),
    changeFormat: (d) => `${d > 0 ? "▲" : "▼"} ${Math.abs(d).toLocaleString("en-GB")} vs previous year`,
    changeUnit: "",
    unit: "people",
    sub: "Mid-year estimate, all ages, United Kingdom",
    frequency: "years",
  },

  /* ---- Tax and welfare ---- */
  {
    id: "uk-total-receipts",
    category: "Finance",
    title: "Total public sector current receipts",
    uri: "/economy/governmentpublicsectorandtaxes/publicsectorfinance/timeseries/anbt/pusf",
    releaseQuery: "Public sector finances",
    cadence: "Annual calendar-year total, revised monthly",
    format: (v) => `£${(v / 1000).toFixed(1)}bn`,
    changeFormat: (d) => `${d > 0 ? "▲" : "▼"} £${Math.abs(d / 1000).toFixed(1)}bn vs previous year`,
    changeUnit: "",
    unit: "£m",
    sub: "All taxes and other current receipts, cash terms, not seasonally adjusted",
    frequency: "years",
  },
  {
    id: "uk-welfare-bill",
    category: "Finance",
    title: "Total welfare bill (net social benefits)",
    uri: "/economy/governmentpublicsectorandtaxes/publicsectorfinance/timeseries/anly/pusf",
    releaseQuery: "Public sector finances",
    cadence: "Annual calendar-year total, revised monthly",
    format: (v) => `£${(v / 1000).toFixed(1)}bn`,
    changeFormat: (d) => `${d > 0 ? "▲" : "▼"} £${Math.abs(d / 1000).toFixed(1)}bn vs previous year`,
    changeUnit: "",
    unit: "£m",
    sub: "Public sector net social benefits paid, cash terms, not seasonally adjusted",
    frequency: "years",
  },

  /* ---- Personnel ---- */
  {
    id: "uk-hm-forces-personnel",
    category: "Defence & security",
    title: "HM Forces personnel",
    uri: "/employmentandlabourmarket/peopleinwork/publicsectorpersonnel/timeseries/c9ll/pse",
    releaseQuery: "Public sector employment",
    cadence: "Quarterly, with public sector employment",
    format: (v) => `${Math.round(v * 1000).toLocaleString("en-GB")}`,
    changeFormat: (d) => `${d > 0 ? "▲" : "▼"} ${Math.abs(Math.round(d * 1000)).toLocaleString("en-GB")} vs previous quarter`,
    changeUnit: "",
    unit: "thousands (FTE)",
    sub: "Full-time equivalent, UK, not seasonally adjusted",
    frequency: "quarters",
  },
  {
    id: "uk-police-personnel",
    category: "Crime",
    title: "Police service personnel",
    uri: "/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/timeseries/g7ex/pse",
    releaseQuery: "Public sector employment",
    cadence: "Quarterly, with public sector employment",
    format: (v) => `${Math.round(v * 1000).toLocaleString("en-GB")}`,
    changeFormat: (d) => `${d > 0 ? "▲" : "▼"} ${Math.abs(Math.round(d * 1000)).toLocaleString("en-GB")} vs previous quarter`,
    changeUnit: "",
    unit: "thousands (headcount)",
    sub: "Headcount, UK police service, seasonally adjusted",
    frequency: "quarters",
  },
];

/* --------------------------- HM Land Registry HPI --------------------------- */

async function housePrices(): Promise<Metric> {
  const base: Metric = {
    id: "uk-house-prices",
    category: "Housing",
    title: "Average UK house price",
    source: "HM Land Registry · UK HPI",
    sourceUrl: "https://landregistry.data.gov.uk/app/ukhpi",
    value: null,
    sub: "All property types, UK",
    period: null,
    asOf: null,
    nextDue: null,
    cadence: "Monthly, around the third Wednesday",
    change: null,
    spark: [],
    status: "unavailable",
    note: null,
  };
  try {
    const data = await getJson<{
      result: {
        items: {
          averagePrice: number;
          percentageAnnualChange: number;
          refMonth: string;
          refPeriodStart?: string;
        }[];
      };
    }>(
      "https://landregistry.data.gov.uk/data/ukhpi/region/united-kingdom/month?_sort=-refMonth&_pageSize=14&_view=all",
    );
    const items = (data.result.items ?? []).filter((i) => typeof i.averagePrice === "number");
    const latest = items[0];
    if (!latest) return { ...base, note: "Source returned no observations." };
    const [y, m] = latest.refMonth.split("-").map(Number);
    // The HPI for month M is published roughly 7 weeks later.
    const published = new Date(Date.UTC(y!, m! + 1, 18));
    const chg = latest.percentageAnnualChange;
    return {
      ...base,
      value: `£${latest.averagePrice.toLocaleString("en-GB")}`,
      period: new Date(Date.UTC(y!, m! - 1, 1)).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      asOf: published.toISOString(),
      nextDue: new Date(Date.UTC(y!, m! + 2, 18)).toISOString(),
      spark: items
        .slice()
        .reverse()
        .map((i) => i.averagePrice),
      change:
        typeof chg === "number"
          ? { label: `${chg > 0 ? "▲" : "▼"} ${Math.abs(chg).toFixed(1)}% year on year`, dir: chg > 0 ? "up" : "down" }
          : null,
      status: "ok",
    };
  } catch (e) {
    return { ...base, note: `Source unreachable: ${(e as Error).message}` };
  }
}

/* -------------------------------- Police.uk -------------------------------- */

async function crime(): Promise<Metric> {
  const base: Metric = {
    id: "uk-street-crime",
    category: "Crime",
    title: "Street-level crimes recorded",
    source: "Police.uk (Home Office open data)",
    sourceUrl: "https://data.police.uk/",
    value: null,
    sub: "Within 1 mile of Westminster, latest published month",
    period: null,
    asOf: null,
    nextDue: null,
    cadence: "Monthly, roughly two months in arrears",
    change: null,
    spark: [],
    status: "unavailable",
    note: null,
  };
  try {
    const dates = await getJson<{ date: string }[]>("https://data.police.uk/api/crimes-street-dates");
    const latest = dates[0]?.date;
    if (!latest) return { ...base, note: "Source returned no published months." };
    const crimes = await getJson<unknown[]>(
      `https://data.police.uk/api/crimes-street/all-crime?lat=51.5074&lng=-0.1278&date=${latest}`,
      30_000,
    );
    const [y, m] = latest.split("-").map(Number);
    const published = new Date(Date.UTC(y!, m! + 1, 15));
    return {
      ...base,
      value: crimes.length.toLocaleString("en-GB"),
      period: new Date(Date.UTC(y!, m! - 1, 1)).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      asOf: published.toISOString(),
      nextDue: new Date(Date.UTC(y!, m! + 2, 15)).toISOString(),
      status: "ok",
      note: "Police.uk publishes street-level records, not national totals. This is a verbatim record count for the requested area and month.",
    };
  } catch (e) {
    return { ...base, note: `Source unreachable: ${(e as Error).message}` };
  }
}

/* --------------------------- Home Office small boats ------------------------ */

interface GovukContent {
  public_updated_at?: string;
  details?: { body?: string };
}

async function smallBoats(): Promise<Metric[]> {
  const url =
    "https://www.gov.uk/api/content/government/publications/migrants-detected-crossing-the-english-channel-in-small-boats/migrants-detected-crossing-the-english-channel-in-small-boats-last-7-days";
  const pageUrl =
    "https://www.gov.uk/government/publications/migrants-detected-crossing-the-english-channel-in-small-boats";
  const mk = (id: string, title: string, sub: string): Metric => ({
    id,
    category: "Irregular immigration & cost",
    title,
    source: "Home Office · small boat activity",
    sourceUrl: pageUrl,
    value: null,
    sub,
    period: null,
    asOf: null,
    nextDue: null,
    cadence: "Daily, published each afternoon",
    change: null,
    spark: [],
    status: "unavailable",
    note: null,
  });
  const daily = mk(
    "uk-small-boats-daily",
    "Irregular arrivals detected, latest day",
    "People detected crossing the Channel in small boats",
  );
  const weekly = mk(
    "uk-small-boats-week",
    "Total irregular arrivals, last 7 days",
    "People detected crossing the Channel in small boats",
  );
  const boatsWeek = mk(
    "uk-small-boats-count-week",
    "Number of boats detected, last 7 days",
    "Small boats recorded arriving over the same seven days",
  );
  try {
    const data = await getJson<GovukContent>(url);
    const body = data.details?.body ?? "";
    const rows = [...body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
      .map((r) =>
        [...r[1]!.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) =>
          c[1]!.replace(/<[^>]+>/g, "").replace(/\u00a0/g, " ").trim(),
        ),
      )
      .filter((cells) => cells.length >= 3 && /\d{4}$/.test(cells[0] ?? ""));
    if (!rows.length) throw new Error("no data rows in published table");
    const series = rows.map((c) => ({
      date: c[0]!,
      arrivals: Number((c[1] ?? "").replace(/,/g, "")),
      boats: Number((c[2] ?? "").replace(/,/g, "")),
    }));
    const last = series[series.length - 1]!;
    const prev = series[series.length - 2];
    const total = series.reduce((a, b) => a + (Number.isFinite(b.arrivals) ? b.arrivals : 0), 0);
    const boatsTotal = series.reduce((a, b) => a + (Number.isFinite(b.boats) ? b.boats : 0), 0);
    const range = `${series[0]!.date} – ${series[series.length - 1]!.date}`;
    const asOf = data.public_updated_at ?? null;
    const nextDue = asOf ? new Date(new Date(asOf).getTime() + 86_400_000).toISOString() : null;
    const delta = prev ? last.arrivals - prev.arrivals : null;
    return [
      {
        ...daily,
        value: last.arrivals.toLocaleString("en-GB"),
        sub: `${last.arrivals.toLocaleString("en-GB")} people in ${last.boats.toLocaleString("en-GB")} boat${last.boats === 1 ? "" : "s"} detected on ${last.date}`,
        period: last.date,
        asOf,
        nextDue,
        spark: series.map((s) => s.arrivals),
        change:
          delta === null
            ? null
            : {
                label: `${delta > 0 ? "▲" : delta < 0 ? "▼" : "■"} ${Math.abs(delta)} vs previous day`,
                dir: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
              },
        status: "ok",
        note: "Provisional UK and French operational data, subject to revision by the Home Office.",
      },
      {
        ...weekly,
        value: `${total.toLocaleString("en-GB")} people`,
        sub: `${total.toLocaleString("en-GB")} people arrived in ${boatsTotal.toLocaleString("en-GB")} boat${boatsTotal === 1 ? "" : "s"} over ${range}`,
        period: range,
        asOf,
        nextDue,
        spark: series.map((s) => s.arrivals),
        status: "ok",
        note: "Small boat detections only, summed from the seven published daily figures. This is the small boat route, not every irregular arrival route; the quarterly illegal-entry total below covers all detected routes.",
      },
      {
        ...boatsWeek,
        value: `${boatsTotal.toLocaleString("en-GB")} boats`,
        sub: `${boatsTotal.toLocaleString("en-GB")} boat${boatsTotal === 1 ? "" : "s"} carrying ${total.toLocaleString("en-GB")} people over ${range}`,
        period: range,
        asOf,
        nextDue,
        spark: series.map((s) => s.boats),
        status: "ok",
        note: "Boats arriving as published daily by the Home Office; boats involved in uncontrolled landings are counted separately in the source table.",
      },
    ];
  } catch (e) {
    const note = `Source unreachable: ${(e as Error).message}`;
    return [
      { ...daily, note },
      { ...weekly, note },
      { ...boatsWeek, note },
    ];
  }
}

/* ---------------------------------- Weather --------------------------------- */

async function weather(): Promise<Metric[]> {
  const mk = (id: string, title: string, sub: string, cadence: string): Metric => ({
    id,
    category: "Weather",
    title,
    source: "Open-Meteo (ECMWF / national model blend)",
    sourceUrl: "https://open-meteo.com/",
    value: null,
    sub,
    period: null,
    asOf: null,
    nextDue: null,
    cadence,
    change: null,
    spark: [],
    status: "unavailable",
    note: null,
  });
  const today = mk("uk-temp-today", "Central England temperature, today", "Daily mean, 52.4°N 1.5°W", "Hourly model refresh");
  const hist = mk(
    "uk-temp-history",
    "Central England temperature, 30-day mean",
    "Observed daily means, archive reanalysis",
    "Daily, two days in arrears",
  );
  try {
    const [fc, ar] = await Promise.all([
      getJson<{
        daily: { time: string[]; temperature_2m_mean: number[]; temperature_2m_max: number[]; temperature_2m_min: number[] };
      }>(
        "https://api.open-meteo.com/v1/forecast?latitude=52.4&longitude=-1.5&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min&timezone=Europe%2FLondon&forecast_days=7",
      ),
      getJson<{ daily: { time: string[]; temperature_2m_mean: number[] } }>(
        `https://archive-api.open-meteo.com/v1/archive?latitude=52.4&longitude=-1.5&start_date=${new Date(Date.now() - 32 * 86_400_000).toISOString().slice(0, 10)}&end_date=${new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10)}&daily=temperature_2m_mean&timezone=Europe%2FLondon`,
      ),
    ]);
    const now = new Date();
    const mean = fc.daily.temperature_2m_mean[0];
    const hi = fc.daily.temperature_2m_max[0];
    const lo = fc.daily.temperature_2m_min[0];
    const arch = (ar.daily.temperature_2m_mean ?? []).filter((n) => typeof n === "number");
    const avg30 = arch.length ? arch.reduce((a, b) => a + b, 0) / arch.length : null;
    return [
      {
        ...today,
        value: mean === undefined ? null : `${mean.toFixed(1)}°C`,
        period: fc.daily.time[0] ?? null,
        asOf: now.toISOString(),
        nextDue: new Date(now.getTime() + 3_600_000).toISOString(),
        spark: fc.daily.temperature_2m_mean,
        change:
          hi === undefined || lo === undefined
            ? null
            : { label: `high ${hi.toFixed(1)}°C · low ${lo.toFixed(1)}°C`, dir: "flat" },
        status: mean === undefined ? "unavailable" : "ok",
      },
      {
        ...hist,
        value: avg30 === null ? null : `${avg30.toFixed(1)}°C`,
        period: `${ar.daily.time[0]} – ${ar.daily.time[ar.daily.time.length - 1]}`,
        asOf: new Date(Date.now() - 2 * 86_400_000).toISOString(),
        nextDue: new Date(Date.now() + 86_400_000).toISOString(),
        spark: arch,
        status: avg30 === null ? "unavailable" : "ok",
      },
    ];
  } catch (e) {
    const note = `Source unreachable: ${(e as Error).message}`;
    return [
      { ...today, note },
      { ...hist, note },
    ];
  }
}

/* ------------------------- GOV.UK / Home Office / MOD ----------------------- */

function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function nextAnnounced(query: string): Promise<string | null> {
  try {
    const r = await getJson<{ results: { release_timestamp: string }[] }>(
      `https://www.gov.uk/api/search.json?filter_format=statistics_announcement&q=${encodeURIComponent(query)}&count=10&fields=release_timestamp&order=release_timestamp`,
    );
    const up = (r.results ?? [])
      .map((x) => x.release_timestamp)
      .filter((d) => d && new Date(d).getTime() > Date.now())
      .sort();
    return up[0] ?? null;
  } catch {
    return null;
  }
}

/** Detected illegal-entry arrivals + people in asylum hotels, from the Home Office HTML release. */
async function immigrationSystem(): Promise<Metric[]> {
  const collection = "https://www.gov.uk/government/collections/immigration-statistics-quarterly-release";
  const base = {
    category: "Irregular immigration & cost" as const,
    source: "Home Office",
    cadence: "Quarterly official statistics",
    change: null,
    spark: [] as number[],
  };
  const fallback: Metric[] = [
    {
      ...base,
      id: "uk-irregular-migration",
      title: "Detected arrivals via illegal entry routes",
      sourceUrl: collection,
      value: null,
      sub: "All detected illegal entry methods, rolling 12 months",
      period: null,
      asOf: null,
      nextDue: null,
      status: "unavailable",
      note: "Home Office release could not be read.",
    },
    {
      ...base,
      id: "uk-asylum-cost",
      title: "Asylum seekers in hotel accommodation",
      sourceUrl: collection,
      value: null,
      sub: "People supported in hotels at the end of the quarter",
      period: null,
      asOf: null,
      nextDue: null,
      status: "unavailable",
      note: "Home Office release could not be read.",
    },
  ];

  try {
    const search = await getJson<{ results: { link: string; public_timestamp: string }[] }>(
      "https://www.gov.uk/api/search.json?q=Immigration%20system%20statistics%20year%20ending&count=10&fields=link,public_timestamp",
    );
    const release = (search.results ?? [])
      .filter((r) => /^\/government\/statistics\/immigration-system-statistics-year-ending-/.test(r.link))
      .sort((a, b) => b.public_timestamp.localeCompare(a.public_timestamp))[0];
    if (!release) return fallback;

    const periodMatch = /year-ending-([a-z]+)-(\d{4})$/.exec(release.link);
    const period = periodMatch
      ? `Year ending ${periodMatch[1]!.charAt(0).toUpperCase()}${periodMatch[1]!.slice(1)} ${periodMatch[2]}`
      : null;

    const [illegal, asylum, due] = await Promise.all([
      getJson<GovukContent>(
        `https://www.gov.uk/api/content${release.link}/how-many-people-come-to-the-uk-via-illegal-entry-routes`,
      ).catch(() => null),
      getJson<GovukContent>(
        `https://www.gov.uk/api/content${release.link}/how-many-people-are-in-the-uk-asylum-system`,
      ).catch(() => null),
      nextAnnounced("Immigration system statistics"),
    ]);

    const out = [...fallback];
    if (illegal?.details?.body) {
      const text = stripTags(illegal.details.body);
      const m = /there were ([\d,]+) detected arrivals via illegal entry routes/i.exec(text);
      const pct = /([\d.]+)% (fewer|more) than in the YE/i.exec(text);
      if (m) {
        out[0] = {
          ...out[0]!,
          value: Number(m[1]!.replace(/,/g, "")).toLocaleString("en-GB"),
          period,
          asOf: illegal.public_updated_at ?? null,
          nextDue: due,
          sourceUrl: `https://www.gov.uk${release.link}/how-many-people-come-to-the-uk-via-illegal-entry-routes`,
          status: "ok",
          change: pct
            ? {
                label: `${pct[1]}% ${pct[2] === "fewer" ? "vs previous year" : "vs previous year"}`,
                dir: pct[2] === "fewer" ? "down" : "up",
              }
            : null,
          note: "Detections only; not all arrivals via illegal routes are detected. Small boats are around 88% of this total.",
        };
      }
    }
    if (asylum?.details?.body) {
      const text = stripTags(asylum.details.body);
      const m = /([\d,]+) \(\d+%\) were in hotel accommodation/i.exec(text);
      if (m) {
        out[1] = {
          ...out[1]!,
          value: Number(m[1]!.replace(/,/g, "")).toLocaleString("en-GB"),
          period,
          asOf: asylum.public_updated_at ?? null,
          nextDue: due,
          sourceUrl: `https://www.gov.uk${release.link}/how-many-people-are-in-the-uk-asylum-system`,
          status: "ok",
          note: "Hotel accommodation is the main driver of asylum support spend. The Home Office publishes the audited cash cost only in its annual report, so no running cost figure is invented here.",
        };
      }
    }
    return out;
  } catch {
    return fallback;
  }
}

/** Lawful (non-irregular) immigration: work, study and family visa grants from the same Home Office release. */
async function legalImmigration(): Promise<Metric[]> {
  const collection = "https://www.gov.uk/government/collections/immigration-statistics-quarterly-release";
  const base = {
    category: "Immigration" as const,
    source: "Home Office · entry clearance visas",
    cadence: "Quarterly official statistics",
    change: null,
    spark: [] as number[],
    status: "unavailable" as const,
    value: null,
    period: null,
    asOf: null,
    nextDue: null,
    sourceUrl: collection,
    note: "Home Office release could not be read.",
  };
  const specs = [
    {
      id: "uk-visas-work",
      slug: "why-do-people-come-to-the-uk-work",
      title: "Work visas granted",
      sub: "All work categories, main applicants and dependants",
      re: /There were ([\d,]+) visas issued \(including dependants\) in all work categories/i,
      note: "Lawful migration route. Visa grants are not the same as arrivals or net migration.",
    },
    {
      id: "uk-visas-study",
      slug: "why-do-people-come-to-the-uk-study",
      title: "Sponsored study visas granted",
      sub: "Sponsored study grants, main applicants and dependants",
      re: /there were ([\d,]+) sponsored study visas grants/i,
      note: "Lawful migration route. Excludes short-term study of under 6 months.",
    },
    {
      id: "uk-visas-family",
      slug: "why-do-people-come-to-the-uk-family",
      title: "Family visas granted",
      sub: "Family route grants, excluding work and study dependants",
      re: /([\d,]+) Family visas were granted/i,
      note: "Lawful migration route. Dependants on work and study visas are counted in those routes.",
    },
  ];
  const fallback: Metric[] = specs.map((s) => ({ ...base, id: s.id, title: s.title, sub: s.sub }));

  try {
    const search = await getJson<{ results: { link: string; public_timestamp: string }[] }>(
      "https://www.gov.uk/api/search.json?q=Immigration%20system%20statistics%20year%20ending&count=10&fields=link,public_timestamp",
    );
    const release = (search.results ?? [])
      .filter((r) => /^\/government\/statistics\/immigration-system-statistics-year-ending-/.test(r.link))
      .sort((a, b) => b.public_timestamp.localeCompare(a.public_timestamp))[0];
    if (!release) return fallback;

    const pm = /year-ending-([a-z]+)-(\d{4})$/.exec(release.link);
    const period = pm ? `Year ending ${pm[1]!.charAt(0).toUpperCase()}${pm[1]!.slice(1)} ${pm[2]}` : null;
    const due = await nextAnnounced("Immigration system statistics");

    const pages = await Promise.all(
      specs.map((s) =>
        getJson<GovukContent>(`https://www.gov.uk/api/content${release.link}/${s.slug}`).catch(() => null),
      ),
    );

    return specs.map((s, i) => {
      const page = pages[i];
      const fb = fallback[i]!;
      if (!page?.details?.body) return fb;
      const m = s.re.exec(stripTags(page.details.body));
      if (!m) return fb;
      return {
        ...fb,
        value: Number(m[1]!.replace(/,/g, "")).toLocaleString("en-GB"),
        period,
        asOf: page.public_updated_at ?? null,
        nextDue: due,
        sourceUrl: `https://www.gov.uk${release.link}/${s.slug}`,
        status: "ok" as const,
        note: s.note,
      };
    });
  } catch {
    return fallback;
  }
}


/** UK defence spending from the World Bank API (SIPRI Military Expenditure Database). */
async function defenceSpend(): Promise<Metric> {
  const base: Metric = {
    id: "uk-defence-spend",
    category: "Defence & security",
    title: "UK defence expenditure",
    source: "World Bank / SIPRI",
    sourceUrl: "https://data.worldbank.org/indicator/MS.MIL.XPND.CD?locations=GB",
    value: null,
    sub: "Total military expenditure, current US dollars",
    period: null,
    asOf: null,
    nextDue: null,
    cadence: "Annual, SIPRI release each April",
    change: null,
    spark: [],
    status: "unavailable",
    note: null,
  };
  type WbRow = { date: string; value: number | null };
  type WbResp = [{ lastupdated?: string }, WbRow[] | null];
  try {
    const [usd, share] = await Promise.all([
      getJson<WbResp>(
        "https://api.worldbank.org/v2/country/GBR/indicator/MS.MIL.XPND.CD?format=json&per_page=15&date=2010:2030",
      ),
      getJson<WbResp>(
        "https://api.worldbank.org/v2/country/GBR/indicator/MS.MIL.XPND.GD.ZS?format=json&per_page=15&date=2010:2030",
      ).catch(() => null),
    ]);
    const rows = (usd[1] ?? []).filter((r) => r.value != null).sort((a, b) => a.date.localeCompare(b.date));
    const latest = rows[rows.length - 1];
    if (!latest) return base;
    const prev = rows[rows.length - 2];
    const pctRow = (share?.[1] ?? []).find((r) => r.date === latest.date);
    const bn = latest.value! / 1_000_000_000;
    const delta = prev ? (latest.value! - prev.value!) / 1_000_000_000 : null;
    return {
      ...base,
      value: `$${bn.toLocaleString("en-GB", { maximumFractionDigits: 1 })}bn`,
      sub: pctRow?.value != null ? `${pctRow.value.toFixed(2)}% of GDP` : base.sub,
      period: latest.date,
      asOf: usd[0]?.lastupdated ? `${usd[0].lastupdated}T00:00:00Z` : null,
      spark: rows.slice(-10).map((r) => r.value!),
      change: delta
        ? {
            label: `$${Math.abs(delta).toFixed(1)}bn vs previous year`,
            dir: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
          }
        : null,
      status: "ok",
      note: "SIPRI's standard NATO-comparable definition, compiled from MOD accounts. MOD's own departmental resources tables are spreadsheet-only.",
    };
  } catch (e) {
    return { ...base, note: `Source unreachable: ${(e as Error).message}` };
  }
}

/* ------------------- Official alert / threat level indicators ---------------- */

const TERROR_STEPS = [
  { label: "Low", tone: "green" as const },
  { label: "Moderate", tone: "yellow" as const },
  { label: "Substantial", tone: "amber" as const },
  { label: "Severe", tone: "red" as const },
  { label: "Critical", tone: "crimson" as const },
];

async function getText(url: string, ms = 20_000): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { headers: { ...UA }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

/** UK-wide and Northern Ireland-related terrorism threat levels, set by JTAC and MI5. */
async function threatLevels(): Promise<Metric[]> {
  const mk = (id: string, title: string, sub: string): Metric => ({
    id,
    category: "Defence & security",
    title,
    source: "MI5 / JTAC via GOV.UK",
    sourceUrl: "https://www.gov.uk/terrorism-national-emergency",
    value: null,
    sub,
    period: null,
    asOf: null,
    nextDue: null,
    cadence: "Reviewed continuously; can change without notice",
    change: null,
    spark: [],
    status: "unavailable",
    note: null,
    scale: { kind: "terror", authority: "JTAC / MI5 · 5 levels", steps: TERROR_STEPS, current: null },
  });

  const uk = mk(
    "uk-threat-level",
    "National terrorism threat level",
    "Threat to the UK from terrorism, set by JTAC",
  );
  const ni = mk(
    "uk-threat-level-ni",
    "Northern Ireland-related terrorism threat level",
    "Threat to Northern Ireland from NI-related terrorism, set by MI5",
  );

  try {
    const c = await getJson<GovukContent & { details?: { parts?: { body: string }[] } }>(
      "https://www.gov.uk/api/content/terrorism-national-emergency",
    );
    const text = stripTags((c.details?.parts ?? []).map((p) => p.body).join(" "));
    const asOf = c.public_updated_at ?? null;
    const note =
      "Official five-step scale: low, moderate, substantial, severe, critical. Threat levels have no expiry date, so the date shown is when the official page last changed.";

    const read = (re: RegExp, m: Metric): Metric => {
      const hit = re.exec(text);
      if (!hit) return m;
      const level = hit[1]!.toLowerCase();
      const idx = TERROR_STEPS.findIndex((s) => s.label.toLowerCase() === level);
      if (idx < 0) return m;
      return {
        ...m,
        value: TERROR_STEPS[idx]!.label,
        period: "Current",
        asOf,
        status: "ok",
        note,
        scale: { ...m.scale!, current: idx },
      };
    };

    return [
      read(/threat to the UK[^.]*from terrorism is (\w+)/i, uk),
      read(/threat to Northern Ireland[^.]*is (\w+)/i, ni),
    ];
  } catch (e) {
    const note = `Source unreachable: ${(e as Error).message}`;
    return [
      { ...uk, note },
      { ...ni, note },
    ];
  }
}

/** Met Office National Severe Weather Warning Service — yellow / amber / red. */
async function metOfficeWarnings(): Promise<Metric> {
  const steps = [
    { label: "None in force", tone: "neutral" as const },
    { label: "Yellow", tone: "yellow" as const },
    { label: "Amber", tone: "amber" as const },
    { label: "Red", tone: "red" as const },
  ];
  const base: Metric = {
    id: "uk-metoffice-warnings",
    category: "National alerts",
    title: "Severe weather warnings in force",
    source: "Met Office · NSWWS",
    sourceUrl: "https://www.metoffice.gov.uk/weather/warnings-and-advice/uk-warnings",
    value: null,
    sub: "National Severe Weather Warning Service, UK-wide",
    period: null,
    asOf: null,
    nextDue: null,
    cadence: "Issued and withdrawn continuously",
    change: null,
    spark: [],
    status: "unavailable",
    note: null,
    scale: { kind: "metoffice", authority: "Met Office · yellow / amber / red", steps, current: null },
  };
  try {
    const xml = await getText("https://www.metoffice.gov.uk/public/data/PWSCache/WarningsRSS/Region/uk");
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]!);
    const titles = items
      .map((i) => /<title>([\s\S]*?)<\/title>/.exec(i)?.[1] ?? "")
      .map((t) => stripTags(t).trim())
      .filter(Boolean);
    const counts = { Yellow: 0, Amber: 0, Red: 0 } as Record<string, number>;
    for (const t of titles) {
      const c = /\b(yellow|amber|red)\b/i.exec(t)?.[1];
      if (c) counts[c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()]!++;
    }
    const highest = counts["Red"] ? 3 : counts["Amber"] ? 2 : counts["Yellow"] ? 1 : 0;
    const pub = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(xml)?.[1]?.trim();
    return {
      ...base,
      value: highest === 0 ? "None in force" : `${steps[highest]!.label} · ${titles.length} in force`,
      sub:
        titles.length === 0
          ? "No Met Office warnings are currently in force for the UK"
          : titles.slice(0, 3).join(" · "),
      period: "Current",
      asOf: new Date().toISOString(),
      status: "ok",
      note: `Read live from the Met Office warnings feed${pub ? ` (feed timestamp ${pub})` : ""}. Colours are the Met Office's own impact/likelihood matrix; this service does not assign them.`,
      scale: { ...base.scale!, current: highest },
    };
  } catch (e) {
    return { ...base, note: `Source unreachable: ${(e as Error).message}` };
  }
}

/** Environment Agency flood alerts and warnings in force (England). */
async function floodWarnings(): Promise<Metric> {
  const steps = [
    { label: "None in force", tone: "neutral" as const },
    { label: "Flood alert", tone: "amber" as const },
    { label: "Flood warning", tone: "red" as const },
    { label: "Severe flood warning", tone: "crimson" as const },
  ];
  const base: Metric = {
    id: "uk-flood-warnings",
    category: "National alerts",
    title: "Flood alerts and warnings in force",
    source: "Environment Agency",
    sourceUrl: "https://check-for-flooding.service.gov.uk/alerts-and-warnings",
    value: null,
    sub: "England, live flood-monitoring service",
    period: null,
    asOf: null,
    nextDue: null,
    cadence: "Updated every 15 minutes",
    change: null,
    spark: [],
    status: "unavailable",
    note: null,
    scale: { kind: "flood", authority: "Environment Agency · 3 levels", steps, current: null },
  };
  try {
    const data = await getJson<{
      items: { severityLevel: number; timeMessageChanged?: string }[];
    }>("https://environment.data.gov.uk/flood-monitoring/id/floods");
    const items = data.items ?? [];
    const severe = items.filter((i) => i.severityLevel === 1).length;
    const warning = items.filter((i) => i.severityLevel === 2).length;
    const alert = items.filter((i) => i.severityLevel === 3).length;
    const highest = severe ? 3 : warning ? 2 : alert ? 1 : 0;
    return {
      ...base,
      value: highest === 0 ? "None in force" : `${alert + warning + severe} in force`,
      sub: `${severe} severe flood warnings · ${warning} flood warnings · ${alert} flood alerts`,
      period: "Current",
      asOf: new Date().toISOString(),
      status: "ok",
      note: "Counts are the Environment Agency's own published records for England, excluding areas where a warning is no longer in force. Scotland (SEPA) and Wales (NRW) publish separately.",
      scale: { ...base.scale!, current: highest },
    };
  } catch (e) {
    return { ...base, note: `Source unreachable: ${(e as Error).message}` };
  }
}

/** UKHSA weather-health alerts — green / yellow / amber / red. */
async function healthAlerts(): Promise<Metric> {
  const steps = [
    { label: "Green", tone: "green" as const },
    { label: "Yellow", tone: "yellow" as const },
    { label: "Amber", tone: "amber" as const },
    { label: "Red", tone: "red" as const },
  ];
  const base: Metric = {
    id: "uk-health-alerts",
    category: "National alerts",
    title: "Weather-health alert level",
    source: "UKHSA / Met Office",
    sourceUrl: "https://weather-health-alerts.service.gov.uk/",
    value: null,
    sub: "Heat and cold health alerting system, England",
    period: null,
    asOf: null,
    nextDue: null,
    cadence: "Issued through the alerting season, reviewed daily",
    change: null,
    spark: [],
    status: "unavailable",
    note: null,
    scale: { kind: "ukhsa", authority: "UKHSA · green / yellow / amber / red", steps, current: null },
  };
  try {
    const html = await getText("https://weather-health-alerts.service.gov.uk/");
    const text = stripTags(html).replace(/\s+/g, " ");
    const hit = /\b(red|amber|yellow|green)\b[^.]{0,40}(heat|cold)[- ]health alert/i.exec(text);
    if (!hit) {
      return {
        ...base,
        note: "No alert level could be read from the UKHSA alerting service. Check the official service directly — no level is assumed here.",
      };
    }
    const colour = hit[1]!.toLowerCase();
    const idx = steps.findIndex((s) => s.label.toLowerCase() === colour);
    return {
      ...base,
      value: steps[idx]!.label,
      sub: `${hit[2]!.toLowerCase()}-health alert, as published by UKHSA`,
      period: "Current",
      asOf: new Date().toISOString(),
      status: "ok",
      note: "Levels are set jointly by UKHSA and the Met Office. Green means no alert is in force; alerts are regional, and the highest level in force is shown.",
      scale: { ...base.scale!, current: idx < 0 ? null : idx },
    };
  } catch (e) {
    return {
      ...base,
      note: `Source unreachable: ${(e as Error).message}. No level is assumed — check the official UKHSA service.`,
    };
  }
}

/** Defra Daily Air Quality Index (DAQI) — official 1-10 bandings. */
async function airQuality(): Promise<Metric> {
  const steps = [
    { label: "Low (1-3)", tone: "green" as const },
    { label: "Moderate (4-6)", tone: "yellow" as const },
    { label: "High (7-9)", tone: "amber" as const },
    { label: "Very high (10)", tone: "red" as const },
  ];
  const base: Metric = {
    id: "uk-air-quality",
    category: "National alerts",
    title: "Air pollution index, highest forecast",
    source: "Defra · UK-AIR",
    sourceUrl: "https://uk-air.defra.gov.uk/forecasting/",
    value: null,
    sub: "Daily Air Quality Index, highest forecast band across UK sites",
    period: null,
    asOf: null,
    nextDue: null,
    cadence: "Forecast issued daily",
    change: null,
    spark: [],
    status: "unavailable",
    note: null,
    scale: { kind: "daqi", authority: "Defra / COMEAP · DAQI 1-10", steps, current: null },
  };
  try {
    const xml = await getText("https://uk-air.defra.gov.uk/assets/rss/forecast.xml");
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]!);
    const todays: number[] = [];
    for (const it of items) {
      const desc = /<description>([\s\S]*?)<\/description>/.exec(it)?.[1] ?? "";
      const nums = [...stripTags(desc).matchAll(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun):\s*(\d{1,2})\b/g)].map((m) =>
        Number(m[1]),
      );
      if (nums.length && Number.isFinite(nums[0])) todays.push(nums[0]!);
    }
    if (!todays.length) return base;
    const max = Math.max(...todays);
    const idx = max >= 10 ? 3 : max >= 7 ? 2 : max >= 4 ? 1 : 0;
    const build = /<lastBuildDate>([\s\S]*?)<\/lastBuildDate>/.exec(xml)?.[1]?.trim() ?? null;
    return {
      ...base,
      value: `${max} · ${steps[idx]!.label.split(" (")[0]}`,
      sub: `Highest index forecast today across ${todays.length} Defra forecast sites`,
      period: "Today's forecast",
      asOf: new Date().toISOString(),
      status: "ok",
      note: `Defra's published Daily Air Quality Index, banded 1-10 by COMEAP. Forecast issued ${build ?? "daily"}; the highest site value is shown, not a national average.`,
      scale: { ...base.scale!, current: idx },
    };
  } catch (e) {
    return { ...base, note: `Source unreachable: ${(e as Error).message}` };
  }
}


/* --------------- Cost of irregular immigration (Home Office accounts) -------- */

async function getBytes(url: string, ms = 25_000): Promise<Uint8Array> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { headers: { ...UA }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return new Uint8Array(await res.arrayBuffer());
  } finally {
    clearTimeout(t);
  }
}

function xmlText(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

interface SheetRow {
  label: string;
  cells: Record<string, string>;
}

function parseSheet(xml: string, shared: string[]): SheetRow[] {
  const rows: SheetRow[] = [];
  for (const rm of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: Record<string, string> = {};
    for (const cm of (rm[1] ?? "").matchAll(
      /<c r="([A-Z]+)\d+"([^>]*)>(?:<f[^>]*>[\s\S]*?<\/f>)?(?:<v>([^<]*)<\/v>)?/g,
    )) {
      const col = cm[1]!;
      const raw = cm[3] ?? "";
      if (!raw) continue;
      cells[col] = cm[2]!.includes('t="s"') ? (shared[Number(raw)] ?? "") : raw;
    }
    rows.push({ label: cells["A"] ?? "", cells });
  }
  return rows;
}

const bn = (pounds: number) => `£${(pounds / 1_000_000_000).toFixed(2)}bn`;
const money = (pounds: number) => {
  if (pounds >= 1_000_000_000) return `£${(pounds / 1_000_000_000).toFixed(2)}bn`;
  if (pounds >= 1_000_000) return `£${(pounds / 1_000_000).toFixed(1)}m`;
  return `£${Math.round(pounds).toLocaleString("en-GB")}`;
};

/**
 * Published asylum support / accommodation outturn from the Home Office annual report
 * core data tables, plus day / week / month rates derived from that published annual total.
 */
async function irregularCost(): Promise<Metric[]> {
  const base = {
    category: "Irregular immigration & cost" as const,
    source: "Home Office annual report and accounts",
    cadence: "Annual, published each summer with the departmental accounts",
    change: null,
    spark: [] as number[],
  };
  const unavailable = (id: string, title: string, sub: string): Metric => ({
    ...base,
    id,
    title,
    sourceUrl: "https://www.gov.uk/government/collections/home-office-annual-reports-and-accounts",
    value: null,
    sub,
    period: null,
    asOf: null,
    nextDue: null,
    status: "unavailable",
    note: "Not published: the Home Office accounts could not be read, so no figure is shown.",
  });
  const fallback = [
    unavailable("uk-irregular-cost-day", "Cost of asylum support per day", "Derived from the published annual outturn"),
    unavailable("uk-irregular-cost-week", "Cost of asylum support per week", "Derived from the published annual outturn"),
    unavailable("uk-irregular-cost-month", "Cost of asylum support per month", "Derived from the published annual outturn"),
    unavailable("uk-irregular-cost-year", "Cost of asylum support per year", "Published resource outturn"),
    unavailable("uk-irregular-cost-decade", "Cost of asylum support per decade", "Sum of published annual outturns"),
  ];

  try {
    const search = await getJson<{ results: { link: string; public_timestamp: string }[] }>(
      "https://www.gov.uk/api/search.json?q=Home%20Office%20annual%20report%20and%20accounts&filter_format=corporate_report&count=10&fields=link,public_timestamp",
    );
    const pub = (search.results ?? [])
      .filter((r) => /^\/government\/publications\/home-office-annual-report-and-accounts-\d{4}-to-\d{4}$/.test(r.link))
      .sort((a, b) => b.link.localeCompare(a.link))[0];
    if (!pub) return fallback;

    const content = await getJson<{
      public_updated_at?: string;
      first_published_at?: string;
      details?: { attachments?: { title?: string; url?: string; content_type?: string }[] };
    }>(`https://www.gov.uk/api/content${pub.link}`);
    const xlsxUrl = (content.details?.attachments ?? []).find(
      (a) => /core data tables/i.test(a.title ?? "") && /\.xlsx$/i.test(a.url ?? ""),
    )?.url;
    if (!xlsxUrl) return fallback;

    const { unzipSync, strFromU8 } = await import("fflate");
    const files = unzipSync(await getBytes(xlsxUrl));
    const sharedXml = strFromU8(files["xl/sharedStrings.xml"]!);
    const shared = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
      xmlText([...(m[1] ?? "").matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((t) => t[1] ?? "").join("")),
    );
    const rows = parseSheet(strFromU8(files["xl/worksheets/sheet1.xml"]!), shared);

    // Column -> financial year, restricted to outturn (not plans) columns.
    const yearRow = rows.find((r) => Object.values(r.cells).some((v) => /^\d{4}-\d{2}$/.test(v)));
    const typeRow = rows.find((r) => Object.values(r.cells).some((v) => /^(OUTTURN|PLANS)$/i.test(v)));
    if (!yearRow || !typeRow) return fallback;
    const cols: { col: string; year: string }[] = [];
    for (const [col, v] of Object.entries(yearRow.cells)) {
      if (/^\d{4}-\d{2}$/.test(v) && /outturn/i.test(typeRow.cells[col] ?? "")) cols.push({ col, year: v });
    }
    cols.sort((a, b) => a.year.localeCompare(b.year));

    // Asylum rows inside the Resource DEL block only (day-to-day spend).
    const start = rows.findIndex((r) => /^resource del$/i.test(r.label.trim()));
    const end = rows.findIndex((r) => /^total resource del/i.test(r.label.trim()));
    const asylumRows = rows.slice(start + 1, end > start ? end : rows.length).filter((r) => /^asylum/i.test(r.label));
    if (!asylumRows.length) return fallback;

    const byYear: { year: string; pounds: number }[] = [];
    for (const { col, year } of cols) {
      let total = 0;
      let seen = false;
      for (const r of asylumRows) {
        const n = Number(r.cells[col]);
        if (Number.isFinite(n) && r.cells[col] !== undefined) {
          total += n;
          if (n > 0) seen = true;
        }
      }
      if (seen) byYear.push({ year, pounds: total * 1000 });
    }
    if (!byYear.length) return fallback;

    const latest = byYear[byYear.length - 1]!;
    const prev = byYear[byYear.length - 2];
    const endYear = Number(latest.year.slice(0, 4)) + 1;
    const unknownFrom = `${endYear}-04-01`;
    const covers = `Financial year ${latest.year} (1 Apr ${latest.year.slice(0, 4)} to 31 Mar ${endYear})`;
    const asOf = content.public_updated_at ?? content.first_published_at ?? pub.public_timestamp ?? null;
    const due = await nextAnnounced("Home Office annual report and accounts");
    const sourceUrl = `https://www.gov.uk${pub.link}`;
    const spark = byYear.map((y) => y.pounds / 1_000_000_000);
    const change = prev
      ? {
          label: `${(((latest.pounds - prev.pounds) / prev.pounds) * 100).toFixed(1)}% vs ${prev.year}`,
          dir: (latest.pounds > prev.pounds ? "up" : latest.pounds < prev.pounds ? "down" : "flat") as
            | "up"
            | "down"
            | "flat",
        }
      : null;
    const line = asylumRows.map((r) => r.label).join(" + ");
    const shared_ = {
      ...base,
      sourceUrl,
      period: `Financial year ${latest.year}`,
      asOf,
      nextDue: due,
      covers,
      unknownFrom,
      status: "ok" as const,
    };

    const rate = (id: string, title: string, pounds: number, per: string): Metric => ({
      ...shared_,
      id,
      title,
      value: money(pounds),
      sub: `Derived from the published ${latest.year} outturn of ${bn(latest.pounds)} — ${per}`,
      spark: [],
      change: null,
      derivedFrom: `Published annual outturn ${bn(latest.pounds)} for ${latest.year}, divided to a ${per.split(" ")[0]} rate`,
      note: `Derived figure, not published as such. The Home Office publishes only the annual outturn (${line}); this card divides that published total. No spend after 31 Mar ${endYear} is published yet.`,
    });

    const years = byYear.map((y) => y.year);
    const decadeTotal = byYear.reduce((a, y) => a + y.pounds, 0);
    const firstYear = Number(years[0]!.slice(0, 4));
    const missing: string[] = [];
    for (let y = endYear - 10; y < firstYear; y++) missing.push(`${y}-${String((y + 1) % 100).padStart(2, "0")}`);

    return [
      rate("uk-irregular-cost-day", "Cost of asylum support per day", latest.pounds / 365, "daily rate"),
      rate("uk-irregular-cost-week", "Cost of asylum support per week", (latest.pounds / 365) * 7, "weekly rate"),
      rate("uk-irregular-cost-month", "Cost of asylum support per month", latest.pounds / 12, "monthly rate"),
      {
        ...shared_,
        id: "uk-irregular-cost-year",
        title: "Cost of asylum support per year",
        value: bn(latest.pounds),
        sub: "Resource DEL outturn on asylum support, resettlement and accommodation",
        spark,
        change,
        note: `Published exactly as reported in the Home Office accounts (${line}), resource DEL outturn. Covers asylum accommodation and support, not the whole cost of the immigration system.`,
      },
      {
        ...shared_,
        id: "uk-irregular-cost-decade",
        title: "Cost of asylum support per decade",
        value: bn(decadeTotal),
        sub: `Sum of ${years.length} published years of the last 10: ${years.join(", ")}`,
        period: `${years[0]} to ${latest.year}`,
        spark,
        change: null,
        covers: `Financial years ${years.join(", ")}`,
        note: missing.length
          ? `Partial total. Published outturn is only available in this table for ${years.join(", ")}; no comparable figure is published here for ${missing.join(", ")}, so those years are excluded rather than estimated.`
          : "Sum of the published annual outturns for the last ten financial years.",
      },
    ];
  } catch {
    return fallback;
  }
}

/* ------- Demographics of small boat arrivals (Home Office table IER_02c) ------ */

/** Expand an ODS row into plain display strings, honouring repeated-cell counts. */
function odsRow(rowXml: string): string[] {
  const out: string[] = [];
  for (const m of rowXml.matchAll(/<table:table-cell([^>]*)(?:\/>|>([\s\S]*?)<\/table:table-cell>)/g)) {
    const attrs = m[1] ?? "";
    const text = xmlText(stripTags(m[2] ?? "")).trim();
    const rep = Number(/table:number-columns-repeated="(\d+)"/.exec(attrs)?.[1] ?? "1");
    for (let i = 0; i < Math.min(rep, 40); i++) out.push(text);
  }
  return out;
}

const ukDate = (s: string | null | undefined): string | null => {
  if (!s) return null;
  const d = new Date(`${s} UTC`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/** Age group and sex of small boat arrivals, reproduced from the published summary table. */
async function smallBoatDemographics(): Promise<Metric[]> {
  const tablesPage = "https://www.gov.uk/government/statistical-data-sets/immigration-system-statistics-data-tables";
  const base = {
    category: "Irregular immigration & cost" as const,
    source: "Home Office",
    cadence: "Quarterly, with the immigration system statistics release",
    change: null,
    spark: [] as number[],
    sourceUrl: tablesPage,
  };
  const unavailable = (id: string, title: string, sub: string): Metric => ({
    ...base,
    id,
    title,
    value: null,
    sub,
    period: null,
    asOf: null,
    nextDue: null,
    status: "unavailable",
    note: "Not published here: the Home Office summary workbook (table IER_02c) could not be read, so no figure is shown.",
  });
  const ids: [string, string, string][] = [
    ["uk-boats-male", "Small boat arrivals: male", "Published sex split, table IER_02c"],
    ["uk-boats-female", "Small boat arrivals: female", "Published sex split, table IER_02c"],
    ["uk-boats-sex-unknown", "Small boat arrivals: sex not recorded", "Published sex split, table IER_02c"],
    ["uk-boats-age-under18", "Small boat arrivals aged 17 and under", "Published age group, table IER_02c"],
    ["uk-boats-age-18-24", "Small boat arrivals aged 18 to 24", "Published age group, table IER_02c"],
    ["uk-boats-age-25-39", "Small boat arrivals aged 25 to 39", "Published age group, table IER_02c"],
    ["uk-boats-age-40plus", "Small boat arrivals aged 40 and over", "Published age group, table IER_02c"],
    ["uk-boats-religion", "Religion of irregular arrivals", "The Home Office does not publish religion for irregular arrivals"],
    ["uk-boats-ethnicity", "Ethnicity of irregular arrivals", "The Home Office does not publish race or ethnicity for irregular arrivals"],
  ];
  const fallback = ids.map(([id, title, sub]) => unavailable(id, title, sub));

  try {
    const content = await getJson<{
      details?: { attachments?: { title?: string; url?: string }[] };
    }>(`https://www.gov.uk/api/content/government/statistical-data-sets/immigration-system-statistics-data-tables`);
    const file = (content.details?.attachments ?? []).find(
      (a) => /illegal entry routes .* summary tables/i.test(a.title ?? "") && /\.ods$/i.test(a.url ?? ""),
    );
    if (!file?.url) return fallback;

    const { unzipSync, strFromU8 } = await import("fflate");
    const files = unzipSync(await getBytes(file.url));
    const xml = strFromU8(files["content.xml"]!);

    const flat = xmlText(stripTags(xml)).replace(/\s+/g, " ");
    const published = ukDate(/Published:\s*(\d{1,2} [A-Za-z]+ \d{4})/.exec(flat)?.[1]);
    const nextDue = ukDate(/Next update:\s*(\d{1,2} [A-Za-z]+ \d{4})/.exec(flat)?.[1]);

    const tbl = /<table:table table:name="IER_02c"[\s\S]*?<\/table:table>/.exec(xml)?.[0];
    if (!tbl) return fallback;
    const rows = [...tbl.matchAll(/<table:table-row[\s\S]*?<\/table:table-row>/g)].map((m) => odsRow(m[0]));

    const header = rows.find((r) => /^age group and sex$/i.test((r[0] ?? "").trim()));
    if (!header) return fallback;
    // Last non-empty header cell is the most recent published period.
    let col = -1;
    for (let i = header.length - 1; i > 0; i--) {
      if ((header[i] ?? "").trim()) {
        col = i;
        break;
      }
    }
    if (col < 1) return fallback;
    const period = header[col]!.trim();
    const num = (s: string | undefined): number | null => {
      const v = Number((s ?? "").replace(/,/g, ""));
      return Number.isFinite(v) && (s ?? "").trim() !== "" ? v : null;
    };

    // Walk the table: each age-group row is followed by its Male / Female / Unknown rows.
    const ageBands = ["17 and under", "18 to 24", "25 to 39", "40 and over"];
    const bands: Record<string, { total: number | null; male: number | null; female: number | null; unknown: number | null }> = {};
    let current: string | null = null;
    let notRecorded: number | null = null;
    let total: number | null = null;
    for (const r of rows) {
      const label = (r[0] ?? "").trim();
      const v = num(r[col]);
      if (ageBands.includes(label)) {
        current = label;
        bands[label] = { total: v, male: null, female: null, unknown: null };
      } else if (current && /^(male|female|unknown)$/i.test(label)) {
        const band = bands[current]!;
        if (/male/i.test(label) && !/female/i.test(label)) band.male = v;
        else if (/female/i.test(label)) band.female = v;
        else band.unknown = v;
      } else if (/^not currently recorded$/i.test(label)) {
        notRecorded = v;
        current = null;
      } else if (/^total$/i.test(label)) {
        total = v;
        current = null;
      }
    }
    if (!total || ageBands.some((b) => bands[b]?.total == null)) return fallback;

    const sum = (pick: "male" | "female" | "unknown") =>
      ageBands.reduce((acc, b) => acc + (bands[b]?.[pick] ?? 0), 0);
    const male = sum("male");
    const female = sum("female");
    const sexUnknown = sum("unknown") + (notRecorded ?? 0);

    const sexParts = [
      { label: "Male", value: male },
      { label: "Female", value: female },
      { label: "Not recorded", value: sexUnknown },
    ];
    const ageParts = ageBands.map((b) => ({ label: b, value: bands[b]!.total! }));

    const share = (v: number) => `${((v / total!) * 100).toFixed(1)}% of the published total`;
    const tableUrl =
      "https://www.gov.uk/government/statistical-data-sets/immigration-system-statistics-data-tables#illegal-entry-routes";
    const partial = /january|-|to /i.test(period) && !/^year ending/i.test(period) && !/^\d{4}$/.test(period);
    const note = `Reproduced from Home Office table IER_02c, "Small boat arrivals, by age group and sex". Covers the small boat route only, not every detected illegal entry route. Shares are calculated from the published counts in the same column and nothing is estimated.${
      partial ? " This column is a part-year period as published and is not annualised." : ""
    }`;

    const card = (
      id: string,
      title: string,
      value: number,
      sub: string,
      parts: { label: string; value: number }[],
      highlight: string,
    ): Metric => ({
      ...base,
      id,
      title,
      sourceUrl: tableUrl,
      value: value.toLocaleString("en-GB"),
      sub,
      period,
      asOf: published,
      nextDue,
      status: "ok",
      note,
      derivedFrom: "Share calculated from the published counts in table IER_02c",
      covers: `${period}, small boat arrivals only`,
      breakdown: parts.map((p) => ({ ...p, highlight: p.label === highlight })),
    });

    /* -------- Nationality (table IER_02b), same published period -------- */
    const natMetrics: Metric[] = [];
    const natTbl = /<table:table table:name="IER_02b"[\s\S]*?<\/table:table>/.exec(xml)?.[0];
    if (natTbl) {
      const natRows = [...natTbl.matchAll(/<table:table-row[\s\S]*?<\/table:table-row>/g)].map((m) => odsRow(m[0]));
      const natHeader = natRows.find((r) => /^nationality$/i.test((r[0] ?? "").trim()));
      // Use the same reference period column as the age/sex table.
      const natCol = natHeader ? natHeader.findIndex((c, i) => i > 0 && c.trim() === period) : -1;
      if (natHeader && natCol > 0) {
        const entries: { label: string; value: number }[] = [];
        let natTotal: number | null = null;
        for (const r of natRows) {
          const label = (r[0] ?? "").trim();
          const v = num(r[natCol]);
          if (!label || v == null) continue;
          if (/^total$/i.test(label)) natTotal = v;
          else if (/^nationality$/i.test(label)) continue;
          else entries.push({ label, value: v });
        }
        if (natTotal && entries.length) {
          const named = entries.filter((e) => !/^all other nationalities$|^not currently recorded$/i.test(e.label));
          const other = entries.find((e) => /^all other nationalities$/i.test(e.label));
          const unrecorded = entries.find((e) => /^not currently recorded$/i.test(e.label));
          const ranked = named.slice().sort((a, b) => b.value - a.value);
          const parts = [...ranked, ...(other ? [other] : []), ...(unrecorded ? [unrecorded] : [])];
          const natNote = `Reproduced from Home Office table IER_02b, "Small boat arrivals, by nationality". Nationality is the only origin characteristic the Home Office publishes for this route; it is not a measure of religion or ethnicity. Shares are calculated from the published counts in the same column.`;
          const top = ranked.slice(0, 8);
          for (const e of [...top, ...(other ? [other] : [])]) {
            natMetrics.push({
              ...base,
              id: `uk-boats-nat-${e.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
              title: /^all other nationalities$/i.test(e.label)
                ? "Small boat arrivals: all other nationalities"
                : `Small boat arrivals: ${e.label}`,
              sourceUrl: tableUrl,
              value: e.value.toLocaleString("en-GB"),
              sub: `${((e.value / natTotal) * 100).toFixed(1)}% of the published total`,
              period,
              asOf: published,
              nextDue,
              status: "ok",
              note: natNote,
              derivedFrom: "Share calculated from the published counts in table IER_02b",
              covers: `${period}, small boat arrivals only`,
              breakdown: parts.map((p) => ({ ...p, highlight: p.label === e.label })),
            });
          }
        }
      }
    }

    /* -------- Characteristics the Home Office does not publish -------- */
    const notCollected = (id: string, title: string, what: string): Metric => ({
      ...base,
      id,
      title,
      sourceUrl: tableUrl,
      value: null,
      emptyLabel: "Not published",
      sub: `Not collected or published by the Home Office`,
      period: null,
      asOf: published,
      nextDue,
      status: "unavailable",
      note: `Checked against the current Home Office release "Illegal entry routes to the UK summary tables" (${period}), which publishes nationality, age group and sex only. No ${what} is collected or released for detected irregular arrivals, so no figure is shown here rather than an estimate. This check runs on every refresh and the card will populate if the Home Office starts publishing it.`,
      covers: `${period}, small boat arrivals only`,
    });

    return [

      card("uk-boats-male", "Small boat arrivals: male", male, share(male), sexParts, "Male"),
      card("uk-boats-female", "Small boat arrivals: female", female, share(female), sexParts, "Female"),
      card(
        "uk-boats-sex-unknown",
        "Small boat arrivals: sex not recorded",
        sexUnknown,
        share(sexUnknown),
        sexParts,
        "Not recorded",
      ),
      card(
        "uk-boats-age-under18",
        "Small boat arrivals aged 17 and under",
        bands["17 and under"]!.total!,
        share(bands["17 and under"]!.total!),
        ageParts,
        "17 and under",
      ),
      card(
        "uk-boats-age-18-24",
        "Small boat arrivals aged 18 to 24",
        bands["18 to 24"]!.total!,
        share(bands["18 to 24"]!.total!),
        ageParts,
        "18 to 24",
      ),
      card(
        "uk-boats-age-25-39",
        "Small boat arrivals aged 25 to 39",
        bands["25 to 39"]!.total!,
        share(bands["25 to 39"]!.total!),
        ageParts,
        "25 to 39",
      ),
      card(
        "uk-boats-age-40plus",
        "Small boat arrivals aged 40 and over",
        bands["40 and over"]!.total!,
        share(bands["40 and over"]!.total!),
        ageParts,
        "40 and over",
      ),
      notCollected("uk-boats-religion", "Religion of irregular arrivals", "religion"),
      notCollected("uk-boats-ethnicity", "Ethnicity of irregular arrivals", "race or ethnicity"),
      ...natMetrics,
    ];

  } catch {
    return fallback;
  }
}


/* ---------------------------------- assembly -------------------------------- */

/** Cached payload: the feeds behind it publish daily at best, and ONS rate-limits bursts. */
let payloadCache: { at: number; data: Promise<StatsPayload> } | null = null;
const PAYLOAD_TTL = 5 * 60_000;

async function collectStats(): Promise<StatsPayload> {
  const tasks: Promise<Metric | Metric[]>[] = [
    ...ONS_DEFS.map((d) => onsMetric(d)),

    housePrices(),
    crime(),
    smallBoats(),
    weather(),
    immigrationSystem(),
    legalImmigration(),
    defenceSpend(),
    threatLevels(),
    metOfficeWarnings(),
    floodWarnings(),
    healthAlerts(),
    airQuality(),

    irregularCost(),
    smallBoatDemographics(),
    recordedCrime(),
    sexualOffences(),
    migrationFlows(),
    Promise.resolve(unpublishedSplits()),


  ];

  const settled = await Promise.allSettled(tasks);
  const metrics: Metric[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") {
      if (Array.isArray(r.value)) metrics.push(...r.value);
      else metrics.push(r.value);
    }
  }
  // Publishers occasionally repeat an offence label; keep every row but make
  // the ids unique so nothing is dropped from the register.
  const seen = new Map<string, number>();
  for (const m of metrics) {
    const n = (seen.get(m.id) ?? 0) + 1;
    seen.set(m.id, n);
    if (n > 1) m.id = `${m.id}-${n}`;
  }
  return { metrics, fetchedAt: new Date().toISOString() };
}

export const getUkStats = createServerFn({ method: "GET" }).handler(async (): Promise<StatsPayload> => {
  if (payloadCache && Date.now() - payloadCache.at < PAYLOAD_TTL) return payloadCache.data;
  const data = collectStats();
  payloadCache = { at: Date.now(), data };
  data.catch(() => {
    payloadCache = null;
  });
  return data;
});

/* ------------------ ONS / Home Office recorded crime (E&W) ------------------ */

const CRIME_DATASET = "/peoplepopulationandcommunity/crimeandjustice/datasets/policeforceareadatatables";

function sheetsByName(files: Record<string, Uint8Array>, strFromU8: (u: Uint8Array) => string) {
  const wb = strFromU8(files["xl/workbook.xml"]!);
  const rels = strFromU8(files["xl/_rels/workbook.xml.rels"]!);
  const relMap = new Map<string, string>();
  for (const m of rels.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)) relMap.set(m[1]!, m[2]!);
  const out = new Map<string, string>();
  for (const m of wb.matchAll(/<sheet[^>]*name="([^"]+)"[^>]*r:id="(rId\d+)"/g)) {
    const target = relMap.get(m[2]!);
    if (!target) continue;
    out.set(xmlText(m[1]!).trim(), `xl/${target.replace(/^\/?xl\//, "")}`);
  }
  return out;
}

/** Reads the England and Wales row of an ONS PFA table, keyed by its published column headings. */
function nationalRow(rows: SheetRow[]): { values: Map<string, string>; title: string } | null {
  const header = rows.find((r) => r.cells["A"]?.trim() === "Area Code");
  const national = rows.find((r) => r.cells["A"]?.trim() === "K04000001");
  if (!header || !national) return null;
  const values = new Map<string, string>();
  for (const [col, head] of Object.entries(header.cells)) {
    const key = head.replace(/\s+/g, " ").replace(/\[note \d+\]/gi, "").trim();
    const v = national.cells[col];
    if (key && v !== undefined) values.set(key, v);
  }
  return { values, title: rows[0]?.label ?? "" };
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function recordedCrime(): Promise<Metric[]> {
  const base = {
    category: "Crime" as const,
    source: "Police recorded crime, Home Office (published by ONS)",
    sourceUrl: `https://www.ons.gov.uk${CRIME_DATASET}`,
    cadence: "Quarterly, with the Crime in England and Wales release",
    spark: [] as number[],
  };
  try {
    const landing = await retrying(() => getJson<{
      datasets?: { uri: string }[];
      description?: { nextRelease?: string };
    }>(`https://www.ons.gov.uk${CRIME_DATASET}/data`));
    const versionUri = landing.datasets?.[0]?.uri;
    if (!versionUri) return [];

    const version = await retrying(() => getJson<{
      downloads?: { file: string }[];
      description?: { releaseDate?: string };
    }>(`https://www.ons.gov.uk${versionUri}/data`));
    const file = version.downloads?.[0]?.file;
    if (!file) return [];

    const { unzipSync, strFromU8 } = await import("fflate");
    const files = unzipSync(
      await retrying(() => getBytes(`https://www.ons.gov.uk/file?uri=${versionUri}/${file}`, 40_000)),
    ) as unknown as Record<string, Uint8Array>;
    const sharedXml = strFromU8(files["xl/sharedStrings.xml"]!);
    const shared = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
      xmlText([...(m[1] ?? "").matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((t) => t[1] ?? "").join("")),
    );
    const names = sheetsByName(files, strFromU8);
    const read = (name: string) => {
      const path = names.get(name);
      if (!path || !files[path]) return null;
      return nationalRow(parseSheet(strFromU8(files[path]!), shared));
    };

    const counts = read("Table P1");
    if (!counts) return [];
    const changes = read("Table P2");
    const rates = read("Table P3");
    const knifeCounts = read("Table P5");
    const knifeRates = read("Table P7");

    const periodMatch = /year ending \w+ \d{4}/i.exec(counts.title);
    const period = periodMatch ? `${periodMatch[0]}, England and Wales` : "England and Wales";
    const asOf = version.description?.releaseDate ?? null;
    const nextAnnouncedDate = landing.description?.nextRelease;
    const parsedNext = nextAnnouncedDate ? new Date(nextAnnouncedDate) : null;
    const nextDue =
      parsedNext && !Number.isNaN(parsedNext.getTime())
        ? parsedNext.toISOString()
        : await onsNextRelease("Crime in England and Wales");

    const population = Number(rates?.values.get("Population figures (mid-2024) rounded to 100") ?? NaN);
    const popLabel = [...(rates?.values.keys() ?? [])].find((k) => k.startsWith("Population figures"));
    const popNote = popLabel ? popLabel.replace("Population figures ", "").replace(/rounded to 100/i, "").trim() : "";

    const skip = new Set(["Area Code", "Area Name"]);
    const metrics: Metric[] = [];

    for (const [name, raw] of counts.values) {
      if (skip.has(name)) continue;
      const n = Number(raw);
      if (!Number.isFinite(n)) continue;
      const rate = Number(rates?.values.get(name) ?? NaN);
      const pct = Number(changes?.values.get(name) ?? NaN);
      const clean = name.replace(/\s+/g, " ").trim();
      const rateText = Number.isFinite(rate)
        ? `${rate < 1 ? rate.toFixed(2) : rate.toFixed(1)} per 1,000 population`
        : "rate per 1,000 not published";
      metrics.push({
        ...base,
        id: `uk-crime-${slug(clean)}`,
        title: clean,
        value: n.toLocaleString("en-GB"),
        sub: `${rateText}${popNote ? ` · ${popNote} population estimate` : ""}`,
        period,
        asOf,
        nextDue,
        change: Number.isFinite(pct)
          ? {
              label: `${pct > 0 ? "+" : ""}${pct.toFixed(1)}% vs previous year`,
              dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat",
            }
          : null,
        status: "ok",
        note:
          "Offences recorded by the police in England and Wales, table P1. Rates are the published rate per 1,000 population in table P3 — no figure is calculated here.",
      });
    }

    const knifeTotalKey = [...(knifeCounts?.values.keys() ?? [])].find((k) => /Total of selected/i.test(k));
    const knifeTotal = Number(knifeCounts?.values.get(knifeTotalKey ?? "") ?? NaN);
    if (Number.isFinite(knifeTotal)) {
      const rateKeys = [...(knifeRates?.values ?? new Map()).keys()].filter((k) => /\d{4}$/.test(k));
      const latestRateKey = rateKeys[rateKeys.length - 1];
      const knifeRate = Number(knifeRates?.values.get(latestRateKey ?? "") ?? NaN);
      metrics.push({
        ...base,
        id: "uk-crime-knife-selected-offences",
        title: "Selected offences involving a knife or sharp instrument",
        value: knifeTotal.toLocaleString("en-GB"),
        sub: Number.isFinite(knifeRate)
          ? `${knifeRate.toFixed(1)} per 100,000 population`
          : "rate per 100,000 not published",
        period,
        asOf,
        nextDue,
        change: null,
        status: "ok",
        note:
          "Attempted murder, threats to kill, assault with injury or intent, robbery, rape and sexual assault, and homicide involving a knife — tables P5 and P7. Population rate is per 100,000, as the Home Office publishes it.",
      });
    }

    if (Number.isFinite(population)) {
      metrics.push({
        ...base,
        id: "uk-crime-population-denominator",
        title: "Population used for crime rates",
        value: population.toLocaleString("en-GB"),
        sub: `${popNote || "ONS mid-year"} population estimate for England and Wales`,
        period,
        asOf,
        nextDue,
        change: null,
        status: "ok",
        note: "The denominator the Home Office uses for its published per-population crime rates.",
      });
    }

    return metrics;
  } catch (e) {
    console.error("recordedCrime failed", e);
    return [];
  }
}

/* ------------------ Sexual offences in detail (ONS appendix tables) ------------------ */

const CRIME_APPENDIX =
  "/peoplepopulationandcommunity/crimeandjustice/datasets/crimeinenglandandwalesappendixtables";

const norm = (s: string) => s.replace(/\s+/g, " ").replace(/\[note[^\]]*\]/gi, "").trim();
const num = (v: string | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const pctLabel = (p: number) => `${p > 0 ? "+" : ""}${p.toFixed(1)}% vs previous year`;

/**
 * Published sexual offence detail from the ONS "Crime in England and Wales: Appendix tables"
 * release: table A6 (rate per 1,000 population, count, changes), A5a (offence-level counts)
 * and A7 (published rate series). Every figure shown is read from the publisher's own cells.
 */
async function sexualOffences(): Promise<Metric[]> {
  const base = {
    category: "Crime" as const,
    source: "Police recorded crime, Home Office (published by ONS)",
    sourceUrl: `https://www.ons.gov.uk${CRIME_APPENDIX}`,
    cadence: "Quarterly, with the Crime in England and Wales release",
  };
  try {
    // Stagger behind the other ONS workbook fetch so the publisher does not rate-limit us.
    await wait(4_000);
    const landing = await retrying(() => getJson<{
      datasets?: { uri: string }[];
      description?: { nextRelease?: string };
    }>(`https://www.ons.gov.uk${CRIME_APPENDIX}/data`));
    const versionUri = landing.datasets?.[0]?.uri;
    if (!versionUri) return [];

    const version = await retrying(() => getJson<{
      downloads?: { file: string }[];
      description?: { releaseDate?: string };
    }>(`https://www.ons.gov.uk${versionUri}/data`));
    const file = version.downloads?.[0]?.file;
    if (!file) return [];

    const { unzipSync, strFromU8 } = await import("fflate");
    const files = unzipSync(
      await retrying(() => getBytes(`https://www.ons.gov.uk/file?uri=${versionUri}/${file}`, 60_000)),
    ) as unknown as Record<string, Uint8Array>;
    const sharedXml = strFromU8(files["xl/sharedStrings.xml"]!);
    const shared = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
      xmlText([...(m[1] ?? "").matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((t) => t[1] ?? "").join("")),
    );
    const names = sheetsByName(files, strFromU8);
    const read = (name: string): SheetRow[] => {
      const path = names.get(name);
      if (!path || !files[path]) return [];
      return parseSheet(strFromU8(files[path]!), shared);
    };

    const a6 = read("Table A6");
    const a7 = read("Table A7");
    const a5 = read("Table A5a");
    if (!a6.length || !a5.length) return [];

    const asOf = version.description?.releaseDate ?? null;
    const announced = landing.description?.nextRelease
      ? new Date(landing.description.nextRelease)
      : null;
    const nextDue =
      announced && !Number.isNaN(announced.getTime())
        ? announced.toISOString()
        : await onsNextRelease("Crime in England and Wales");

    const yearEnding = /year ending \w+ \d{4}/i.exec(a6[1]?.label ?? a6[0]?.label ?? "");
    const period = yearEnding ? `${yearEnding[0]}, England and Wales` : "England and Wales";

    /* ---- Table A6: rate per 1,000 population, count, year-on-year and ten-year change ---- */
    const a6Header = a6.find((r) => norm(r.cells["A"] ?? "").startsWith("Offence type"));
    if (!a6Header) return [];
    const colWith = (header: SheetRow, needle: RegExp) =>
      Object.entries(header.cells).find(([, v]) => needle.test(norm(v)))?.[0];
    const rateCol = colWith(a6Header, /^Rate per 1,000/i);
    const countCol = colWith(a6Header, /^Number of recorded/i);
    const decadeCol = colWith(a6Header, /with Apr \d{4}/i);
    const yoyCol = colWith(a6Header, /with previous year/i);

    const a6Row = (label: string) =>
      a6.find((r) => norm(r.cells["A"] ?? "").toLowerCase() === label.toLowerCase());

    /* ---- Table A7: published rate per 1,000 population series, for the sparkline ---- */
    const a7Header = a7.find((r) => norm(r.cells["A"] ?? "").startsWith("Offence group"));
    const a7YearCols = a7Header
      ? Object.entries(a7Header.cells)
          .filter(([, v]) => /^Apr \d{4} to/i.test(norm(v)))
          .map(([c]) => c)
      : [];
    const seriesFor = (label: string): number[] => {
      const row = a7.find((r) => norm(r.cells["A"] ?? "").toLowerCase() === label.toLowerCase());
      if (!row) return [];
      return a7YearCols.map((c) => num(row.cells[c])).filter((n): n is number => n !== null);
    };

    const metrics: Metric[] = [];
    const rape = num(a6Row("Rape")?.cells[countCol ?? ""]);
    const other = num(a6Row("Other sexual offences")?.cells[countCol ?? ""]);

    const headline: { label: string; title: string; id: string; note: string }[] = [
      {
        label: "Sexual offences",
        title: "Sexual offences recorded by the police",
        id: "uk-crime-sexual-offences-total",
        note: "Total sexual offences recorded by the police in England and Wales, ONS appendix table A6. The rate per 1,000 population is the publisher's own figure.",
      },
      {
        label: "Rape",
        title: "Rape offences recorded by the police",
        id: "uk-crime-sexual-rape",
        note: "Rape offences recorded by the police, ONS appendix table A6. Recorded crime counts reflect reporting and recording practice as well as offending.",
      },
      {
        label: "Other sexual offences",
        title: "Other sexual offences recorded by the police",
        id: "uk-crime-sexual-other",
        note: "All sexual offences other than rape, ONS appendix table A6.",
      },
    ];

    for (const h of headline) {
      const row = a6Row(h.label);
      const count = num(row?.cells[countCol ?? ""]);
      if (count === null) continue;
      const rate = num(row?.cells[rateCol ?? ""]);
      const yoy = num(row?.cells[yoyCol ?? ""]);
      const decade = num(row?.cells[decadeCol ?? ""]);
      metrics.push({
        ...base,
        id: h.id,
        title: h.title,
        value: count.toLocaleString("en-GB"),
        sub: [
          rate !== null ? `${rate.toFixed(2)} per 1,000 population` : "rate per 1,000 not published",
          decade !== null
            ? `${decade > 0 ? "+" : ""}${decade.toFixed(1)}% vs ten years earlier`
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
        period,
        asOf,
        nextDue,
        change: yoy !== null ? { label: pctLabel(yoy), dir: yoy > 0 ? "up" : yoy < 0 ? "down" : "flat" } : null,
        spark: seriesFor(h.label),
        status: "ok",
        note: h.note,
        breakdown:
          h.label === "Sexual offences" && rape !== null && other !== null
            ? [
                { label: "Rape", value: rape, highlight: true },
                { label: "Other sexual offences", value: other },
              ]
            : null,
      });
    }

    /* ---- Table A5a: individual published sexual offence categories ---- */
    const a5Header = a5.find((r) => norm(r.cells["B"] ?? "") === "Offence category");
    if (a5Header) {
      const a5YearCols = Object.entries(a5Header.cells)
        .filter(([, v]) => /^Apr \d{4} to/i.test(norm(v)) && !/% change/i.test(norm(v)))
        .map(([c]) => c);
      const latestCol = a5YearCols[a5YearCols.length - 1];
      const a5PctCol = Object.entries(a5Header.cells).find(([, v]) => /% change/i.test(norm(v)))?.[0];
      const summary = /^(rape|other sexual offences|total sexual offences)$/i;
      for (const row of a5) {
        const label = norm(row.cells["B"] ?? "");
        if (!label || !/rape|sexual/i.test(label)) continue;
        if (summary.test(label)) continue;
        if (/obscene publications/i.test(label)) continue;
        const raw = (row.cells[latestCol ?? ""] ?? "").trim();
        const count = num(raw);
        const code = (row.cells["A"] ?? "").trim();
        const codeLabel = code && /^[0-9]+[A-Z]?$/.test(code) ? `Home Office offence code ${code}` : null;
        const pct = num(row.cells[a5PctCol ?? ""]);
        metrics.push({
          ...base,
          id: `uk-crime-sexual-${slug(label)}`,
          title: label,
          value: count !== null ? count.toLocaleString("en-GB") : null,
          emptyLabel: count === null ? "Not published" : null,
          sub: [codeLabel, "rate per 1,000 not published at this level of detail"]
            .filter(Boolean)
            .join(" · "),
          period,
          asOf,
          nextDue,
          change:
            count !== null && pct !== null
              ? { label: pctLabel(pct), dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat" }
              : null,
          spark: [],
          status: count !== null ? "ok" : "unavailable",
          note:
            count !== null
              ? "Offence-level count from ONS appendix table A5a. ONS publishes a rate per 1,000 population only at offence-group level, so none is shown here."
              : "ONS publishes this category as unavailable or suppressed in appendix table A5a, so no figure is shown.",
        });
      }
    }

    return metrics;
  } catch (e) {
    console.error("sexualOffences failed", e);
    return [];
  }
}

/* ------------------------------- full history ------------------------------- */

/**
 * Returns the complete published series for one ONS-backed metric, exactly as
 * the publisher releases it. Gaps in the source stay gaps: nothing is filled in.
 */
export const getMetricHistory = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data }): Promise<HistoryPayload | null> => {
    const def = ONS_DEFS.find((d) => d.id === data.id);
    if (!def) return null;
    const [series, nextDue] = await Promise.all([onsSeries(def.uri), onsNextRelease(def.releaseQuery)]);
    const points = onsPoints(series, def.frequency).map((p) => ({
      label: p.label,
      value: Number(p.value),
      formatted: def.format(Number(p.value)),
      updated: p.updateDate ?? null,
    }));
    return {
      id: def.id,
      title: def.title,
      category: def.category,
      subcategory: def.subcategory ?? null,
      sub: def.sub ?? null,
      source: "Office for National Statistics",
      sourceUrl: `https://www.ons.gov.uk${def.uri}`,
      seriesTitle: series.description?.title ?? def.title,
      cadence: def.cadence,
      unit: def.unit ?? "",
      nextDue,
      points,
      fetchedAt: new Date().toISOString(),
    };
  });

/* ------------------------- Long-term international migration ------------------------- */

const LTIM_DATASET =
  "/peoplepopulationandcommunity/populationandmigration/internationalmigration/datasets/longterminternationalimmigrationemigrationandnetmigrationflowsprovisional";

interface LtimRow {
  flow: string;
  period: string;
  all: number | null;
  british: number | null;
  eu: number | null;
  nonEu: number | null;
}

interface LtimTable {
  rows: LtimRow[];
  asOf: string | null;
  nextDue: string | null;
  sourceUrl: string;
}

let ltimCache: { at: number; data: Promise<LtimTable | null> } | null = null;

async function ltimTable(): Promise<LtimTable | null> {
  if (ltimCache && Date.now() - ltimCache.at < 60 * 60_000) return ltimCache.data;
  const p = (async (): Promise<LtimTable | null> => {
    const landing = await retrying(() =>
      getJson<{ datasets?: { uri: string }[]; description?: { nextRelease?: string } }>(
        `https://www.ons.gov.uk${LTIM_DATASET}/data`,
      ),
    );
    const versionUri = landing.datasets?.[0]?.uri;
    if (!versionUri) return null;
    const version = await retrying(() =>
      getJson<{ downloads?: { file: string }[]; description?: { releaseDate?: string } }>(
        `https://www.ons.gov.uk${versionUri}/data`,
      ),
    );
    const file = version.downloads?.[0]?.file;
    if (!file) return null;

    const { unzipSync, strFromU8 } = await import("fflate");
    const files = unzipSync(
      await retrying(() => getBytes(`https://www.ons.gov.uk/file?uri=${versionUri}/${file}`, 40_000)),
    ) as unknown as Record<string, Uint8Array>;
    const sharedXml = strFromU8(files["xl/sharedStrings.xml"]!);
    const shared = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
      xmlText([...(m[1] ?? "").matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((t) => t[1] ?? "").join("")),
    );
    const names = sheetsByName(files, strFromU8);
    const path = names.get("1");
    if (!path || !files[path]) return null;
    const sheet = parseSheet(strFromU8(files[path]!), shared);

    const numOf = (v: string | undefined) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    const rows: LtimRow[] = [];
    for (const r of sheet) {
      const flow = (r.cells["A"] ?? "").trim();
      if (!/^(Immigration|Emigration|Net migration)$/i.test(flow)) continue;
      rows.push({
        flow,
        period: (r.cells["B"] ?? "").trim(),
        all: numOf(r.cells["C"]),
        british: numOf(r.cells["D"]),
        eu: numOf(r.cells["E"]),
        nonEu: numOf(r.cells["F"]),
      });
    }
    if (!rows.length) return null;

    const announced = landing.description?.nextRelease ? new Date(landing.description.nextRelease) : null;
    return {
      rows,
      asOf: version.description?.releaseDate ?? null,
      nextDue:
        announced && !Number.isNaN(announced.getTime())
          ? announced.toISOString()
          : await onsNextRelease("Long-term international migration"),
      sourceUrl: `https://www.ons.gov.uk${versionUri}`,
    };
  })();
  ltimCache = { at: Date.now(), data: p };
  p.catch(() => (ltimCache = null));
  return p;
}

/** Expands "YE Dec 25 P" into the published period wording. */
function ltimPeriodLabel(raw: string): string {
  const m = /YE (\w{3}) (\d{2})/i.exec(raw);
  if (!m) return raw;
  const months: Record<string, string> = {
    jan: "January", feb: "February", mar: "March", apr: "April", may: "May", jun: "June",
    jul: "July", aug: "August", sep: "September", oct: "October", nov: "November", dec: "December",
  };
  const month = months[m[1]!.toLowerCase()] ?? m[1]!;
  const flags = /\bP\b/.test(raw) ? " (provisional)" : /\bR\b/.test(raw) ? " (revised)" : "";
  return `Year ending ${month} 20${m[2]}${flags}`;
}

async function migrationFlows(): Promise<Metric[]> {
  const base = {
    category: "Population & migration" as const,
    subcategory: "Migration",
    source: "Office for National Statistics · Long-term international migration",
    cadence: "Twice yearly, provisional estimates",
    spark: [] as number[],
  };
  const fallbackUrl = `https://www.ons.gov.uk${LTIM_DATASET}`;
  try {
    const table = await ltimTable();
    if (!table) return [];
    const url = table.sourceUrl || fallbackUrl;
    const series = (flow: string) => table.rows.filter((r) => r.flow.toLowerCase() === flow.toLowerCase());
    const count = (n: number | null) => (n === null ? null : n.toLocaleString("en-GB"));

    const build = (
      id: string,
      title: string,
      flow: string,
      pick: (r: LtimRow) => number | null,
      sub: string,
      note: string,
    ): Metric | null => {
      const rows = series(flow).filter((r) => pick(r) !== null);
      const last = rows[rows.length - 1];
      if (!last) return null;
      const prev = rows[rows.length - 2];
      const v = pick(last)!;
      const pv = prev ? pick(prev) : null;
      return {
        ...base,
        id,
        title,
        sourceUrl: url,
        value: count(v),
        sub,
        period: ltimPeriodLabel(last.period),
        asOf: table.asOf,
        nextDue: table.nextDue,
        change:
          pv === null
            ? null
            : {
                label: `${v > pv ? "▲" : v < pv ? "■" : "■"} ${Math.abs(v - pv).toLocaleString("en-GB")} vs previous quarter estimate`,
                dir: v > pv ? "up" : v < pv ? "down" : "flat",
              },
        spark: rows.slice(-16).map((r) => pick(r)!),
        status: "ok",
        note,
      };
    };

    const allOf = (r: LtimRow) => r.all;
    const britishOf = (r: LtimRow) => r.british;
    const nonEuOf = (r: LtimRow) => r.nonEu;

    const published = "Figures are published rounded by the ONS in table 1 of the long-term international migration release; nothing is recalculated here.";

    const metrics = [
      build("uk-net-migration", "Net migration to the UK", "Net migration", allOf, "All nationalities, long-term international migration", published),
      build("uk-ltim-immigration", "Long-term immigration", "Immigration", allOf, "All nationalities, people arriving for 12 months or more", published),
      build("uk-ltim-emigration", "Long-term emigration", "Emigration", allOf, "All nationalities, people leaving for 12 months or more", published),
      build("uk-ltim-emigration-british", "British nationals emigrating", "Emigration", britishOf, "British nationals leaving the UK long term — remigration", published),
      build("uk-ltim-immigration-british", "British nationals returning", "Immigration", britishOf, "British nationals arriving in the UK long term", published),
      build("uk-ltim-immigration-noneu", "Non-EU+ long-term immigration", "Immigration", nonEuOf, "Non-EU+ nationals arriving for 12 months or more", published),
    ].filter((m): m is Metric => m !== null);

    return metrics;
  } catch (e) {
    return [
      {
        ...base,
        id: "uk-net-migration",
        title: "Net migration to the UK",
        sourceUrl: fallbackUrl,
        value: null,
        sub: "All nationalities, long-term international migration",
        period: null,
        asOf: null,
        nextDue: null,
        change: null,
        status: "unavailable",
        note: `Source unreachable: ${(e as Error).message}`,
      },
    ];
  }
}

/** Country-of-birth and service-level personnel splits with no machine-readable feed. */
function unpublishedSplits(): Metric[] {
  const noFeed = (
    id: string,
    category: Metric["category"],
    title: string,
    sub: string,
    source: string,
    sourceUrl: string,
    cadence: string,
    note: string,
  ): Metric => ({
    id,
    category,
    subcategory: category === "Population & migration" ? "Population" : "Personnel",
    title,
    source,
    sourceUrl,
    value: null,
    sub,
    period: null,
    asOf: null,
    nextDue: null,
    cadence,
    change: null,
    spark: [],
    status: "no-feed",
    note,
    emptyLabel: "No live feed",
  });

  return [
    noFeed(
      "uk-born-population",
      "Population & migration",
      "UK-born population",
      "Population born in the United Kingdom",
      "Office for National Statistics",
      "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/datasets/a12employmentunemploymentandeconomicinactivitybynationalityandcountryofbirth",
      "No current machine-readable series",
      "The ONS discontinued its country-of-birth population series after June 2021. Country-of-birth estimates are now published only in survey tables (A12 / EMP06) and Census 2021, so no live figure is shown rather than an estimate.",
    ),
    noFeed(
      "uk-foreign-born-population",
      "Population & migration",
      "Non-UK-born population",
      "Population born outside the United Kingdom",
      "Office for National Statistics",
      "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/datasets/a12employmentunemploymentandeconomicinactivitybynationalityandcountryofbirth",
      "No current machine-readable series",
      "The ONS discontinued its country-of-birth population series after June 2021. Follow the source link for the published survey tables and the Census 2021 estimates.",
    ),
    noFeed(
      "uk-armed-forces-by-service",
      "Defence & security",
      "Army, Royal Navy and RAF strength",
      "Trained and untrained strength by service",
      "Ministry of Defence · Quarterly service personnel statistics",
      "https://www.gov.uk/government/collections/uk-armed-forces-quarterly-service-personnel-statistics",
      "Quarterly, published by the MOD",
      "The MOD publishes service-level strength only as spreadsheet tables with no API, so the split is not reproduced here. The UK total above is the ONS full-time equivalent series.",
    ),
  ];
}

/* ------------------------------- map data ------------------------------- */

export interface MapArea {
  code: string;
  name: string;
  value: number;
  formatted: string;
}

export interface MapLayer {
  id: string;
  title: string;
  unit: string;
  source: string;
  sourceUrl: string;
  period: string | null;
  asOf: string | null;
  /** Boundary service on the ONS Open Geography portal. */
  boundary: "pfa" | "region-country" | "scotland-council";
  /** Plain-English geographic coverage of this layer, as published. */
  coverage: string;
  areas: MapArea[];

}

/** Recorded crime rate per 1,000 population for every police force area, as published. */
async function crimeMapLayers(): Promise<MapLayer[]> {
  const landing = await retrying(() =>
    getJson<{ datasets?: { uri: string }[] }>(`https://www.ons.gov.uk${CRIME_DATASET}/data`),
  );
  const versionUri = landing.datasets?.[0]?.uri;
  if (!versionUri) return [];
  const version = await retrying(() =>
    getJson<{ downloads?: { file: string }[]; description?: { releaseDate?: string } }>(
      `https://www.ons.gov.uk${versionUri}/data`,
    ),
  );
  const file = version.downloads?.[0]?.file;
  if (!file) return [];
  const { unzipSync, strFromU8 } = await import("fflate");
  const files = unzipSync(
    await retrying(() => getBytes(`https://www.ons.gov.uk/file?uri=${versionUri}/${file}`, 40_000)),
  ) as unknown as Record<string, Uint8Array>;
  const sharedXml = strFromU8(files["xl/sharedStrings.xml"]!);
  const shared = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    xmlText([...(m[1] ?? "").matchAll(/<t[^>]*>([^<]*)<\/t>/g)].map((t) => t[1] ?? "").join("")),
  );
  const names = sheetsByName(files, strFromU8);
  const path = names.get("Table P3");
  if (!path || !files[path]) return [];
  const rows = parseSheet(strFromU8(files[path]!), shared);
  const header = rows.find((r) => (r.cells["A"] ?? "").trim() === "Area Code");
  if (!header) return [];
  const title = rows[0]?.label ?? "";
  const period = /year ending \w+ \d{4}/i.exec(title)?.[0] ?? null;

  const col = (needle: RegExp) =>
    Object.entries(header.cells).find(([, v]) => needle.test(v.replace(/\s+/g, " ")))?.[0];
  const totalCol = col(/^TOTAL RECORDED CRIME/i) ?? col(/Total recorded crime/i);
  const violenceCol = col(/^Violence against the person/i);
  const sexualCol = col(/^Sexual offences/i);
  const theftCol = col(/^Theft offences/i);
  const nameCol = Object.entries(header.cells).find(([, v]) => /Area Name/i.test(v))?.[0] ?? "B";

  const layerFor = (id: string, layerTitle: string, column: string | undefined): MapLayer | null => {
    if (!column) return null;
    const areas: MapArea[] = [];
    for (const r of rows) {
      const code = (r.cells["A"] ?? "").trim();
      if (!/^E23|^W15/.test(code)) continue;
      const value = Number(r.cells[column]);
      if (!Number.isFinite(value)) continue;
      areas.push({
        code,
        name: (r.cells[nameCol] ?? "").trim(),
        value,
        formatted: `${value.toFixed(1)} per 1,000`,
      });
    }
    if (!areas.length) return null;
    return {
      id,
      title: layerTitle,
      unit: "offences per 1,000 population",
      source: "Police recorded crime, Home Office (published by ONS)",
      sourceUrl: `https://www.ons.gov.uk${CRIME_DATASET}`,
      period,
      asOf: version.description?.releaseDate ?? null,
      boundary: "pfa",
      coverage: "England and Wales only — National Crime Recording Standard",
      areas,
    };
  };


  return [
    layerFor("crime-total", "All recorded crime", totalCol),
    layerFor("crime-violence", "Violence against the person", violenceCol),
    layerFor("crime-sexual", "Sexual offences", sexualCol),
    layerFor("crime-theft", "Theft offences", theftCol),
  ].filter((l): l is MapLayer => l !== null);
}

const HPI_REGIONS: { code: string; slug: string; name: string }[] = [
  { code: "E12000001", slug: "north-east", name: "North East" },
  { code: "E12000002", slug: "north-west", name: "North West" },
  { code: "E12000003", slug: "yorkshire-and-the-humber", name: "Yorkshire and The Humber" },
  { code: "E12000004", slug: "east-midlands", name: "East Midlands" },
  { code: "E12000005", slug: "west-midlands", name: "West Midlands" },
  { code: "E12000006", slug: "east-of-england", name: "East of England" },
  { code: "E12000007", slug: "london", name: "London" },
  { code: "E12000008", slug: "south-east", name: "South East" },
  { code: "E12000009", slug: "south-west", name: "South West" },
  { code: "S92000003", slug: "scotland", name: "Scotland" },
  { code: "W92000004", slug: "wales", name: "Wales" },
  { code: "N92000002", slug: "northern-ireland", name: "Northern Ireland" },
];

/** Average house price for every English region and for Scotland, Wales and Northern Ireland. */

async function housePriceMapLayer(): Promise<MapLayer | null> {
  const results = await Promise.all(
    HPI_REGIONS.map(async (r) => {
      try {
        const data = await getJson<{
          result: { items: { averagePrice: number; refMonth: string }[] };
        }>(
          `https://landregistry.data.gov.uk/data/ukhpi/region/${r.slug}/month?_sort=-refMonth&_pageSize=1&_view=all`,
        );
        const item = data.result.items?.[0];
        if (!item || typeof item.averagePrice !== "number") return null;
        return {
          area: {
            code: r.code,
            name: r.name,
            value: item.averagePrice,
            formatted: `£${item.averagePrice.toLocaleString("en-GB")}`,
          } satisfies MapArea,
          refMonth: item.refMonth,
        };
      } catch {
        return null;
      }
    }),
  );
  const ok = results.filter((r): r is NonNullable<typeof r> => r !== null);
  if (!ok.length) return null;
  const refMonth = ok[0]!.refMonth;
  const [y, m] = refMonth.split("-").map(Number);
  return {
    id: "house-prices",
    title: "Average house price",
    unit: "average price paid",
    source: "HM Land Registry · UK HPI",
    sourceUrl: "https://landregistry.data.gov.uk/app/ukhpi",
    period: new Date(Date.UTC(y!, m! - 1, 1)).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }),
    asOf: null,
    boundary: "region-country",
    coverage: "United Kingdom — English regions, plus Scotland, Wales and Northern Ireland as published",
    areas: ok.map((r) => r.area),
  };
}

/** Council-area recorded crime published by the Scottish Government from Police Scotland returns. */
const SCOT_CRIME_TYPES: { id: string; slug: string; title: string }[] = [
  { id: "scotland-crime-total", slug: "all-crimes", title: "Scotland — all recorded crimes" },
  {
    id: "scotland-crime-violence",
    slug: "all-group-1-non-sexual-crimes-of-violence",
    title: "Scotland — non-sexual crimes of violence",
  },
  { id: "scotland-crime-sexual", slug: "all-group-2-sexual-crimes", title: "Scotland — sexual crimes" },
  { id: "scotland-crime-dishonesty", slug: "all-group-3-crimes-of-dishonesty", title: "Scotland — crimes of dishonesty" },
];

async function scotlandCrimeLayers(): Promise<MapLayer[]> {
  const sparql = async <T>(query: string) =>
    getJson<T>(`https://statistics.gov.scot/sparql?query=${encodeURIComponent(query)}`, 45_000);

  const periodRes = await sparql<{ results: { bindings: { p: { value: string } }[] } }>(
    `PREFIX qb: <http://purl.org/linked-data/cube#>
PREFIX sd: <http://purl.org/linked-data/sdmx/2009/dimension#>
SELECT DISTINCT ?p WHERE {
  ?s qb:dataSet <http://statistics.gov.scot/data/recorded-crime> ; sd:refPeriod ?p .
} ORDER BY DESC(?p) LIMIT 1`,
  );
  const latest = periodRes.results.bindings[0]?.p.value;
  if (!latest) return [];
  const latestLabel = latest.replace(/.*\//, "");
  const periodLabel = `${latestLabel.replace("-", "/")} financial year`;

  const slugFilter = SCOT_CRIME_TYPES.map((t) => `"${t.slug}"`).join(", ");
  const body = await sparql<{ results: { bindings: Record<string, { value: string }>[] } }>(
    `PREFIX qb: <http://purl.org/linked-data/cube#>
PREFIX sd: <http://purl.org/linked-data/sdmx/2009/dimension#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?area ?name ?crime ?count WHERE {
  ?s qb:dataSet <http://statistics.gov.scot/data/recorded-crime> ;
     sd:refPeriod <${latest}> ;
     sd:refArea ?a ;
     <http://statistics.gov.scot/def/dimension/crimeOrOffence> ?c ;
     <http://statistics.gov.scot/def/measure-properties/count> ?count .
  ?a rdfs:label ?name .
  BIND(REPLACE(STR(?a), ".*/", "") AS ?area)
  BIND(REPLACE(STR(?c), ".*/", "") AS ?crime)
  FILTER(STRSTARTS(?area, "S12"))
  FILTER(?crime IN (${slugFilter}))
}`,
  );

  const rows = body.results.bindings.map((b) => ({
    area: b["area"]!.value,
    name: b["name"]!.value,
    crime: b["crime"]!.value,
    count: Number(b["count"]!.value),
  }));
  if (!rows.length) return [];



  return SCOT_CRIME_TYPES.map((t): MapLayer | null => {
    const areas: MapArea[] = rows
      .filter((r) => r.crime === t.slug && Number.isFinite(r.count))
      .map((r) => ({
        code: r.area,
        name: r.name,
        value: r.count,
        formatted: `${r.count.toLocaleString("en-GB")} recorded`,
      }));
    if (!areas.length) return null;
    return {
      id: t.id,
      title: t.title,
      unit: "crimes recorded",
      source: "Recorded Crime in Scotland — Scottish Government / Police Scotland",
      sourceUrl: "https://statistics.gov.scot/data/recorded-crime",
      period: periodLabel,
      asOf: null,
      boundary: "scotland-council",
      coverage:
        "Scotland only — Scottish Crime Recording Standard; counts are not comparable with England and Wales figures",
      areas,
    };
  }).filter((l): l is MapLayer => l !== null);
}

let mapCache: { at: number; data: Promise<MapLayer[]> } | null = null;

/** Every regional layer the map can draw, each straight from its publisher. */
export const getMapLayers = createServerFn({ method: "GET" }).handler(async (): Promise<MapLayer[]> => {
  if (mapCache && Date.now() - mapCache.at < 30 * 60_000) return mapCache.data;
  const p = (async () => {
    const [crime, scotland, houses] = await Promise.all([
      crimeMapLayers().catch(() => [] as MapLayer[]),
      retrying(() => scotlandCrimeLayers()).catch(() => [] as MapLayer[]),
      housePriceMapLayer().catch(() => null),
    ]);
    return [...crime, ...scotland, ...(houses ? [houses] : [])];
  })();
  mapCache = { at: Date.now(), data: p };
  p.catch(() => (mapCache = null));
  return p;
});


export interface StreetCrime {
  category: string;
  street: string;
  lat: number;
  lng: number;
  month: string;
  outcome: string | null;
}

/** Street-level crimes published by Police.uk around a point. */
export const getStreetCrime = createServerFn({ method: "GET" })
  .validator((data: { lat: number; lng: number }) => ({ lat: Number(data.lat), lng: Number(data.lng) }))
  .handler(async ({ data }): Promise<{ points: StreetCrime[]; month: string | null; error: string | null }> => {
    try {
      const raw = await getJson<
        {
          category: string;
          location: { latitude: string; longitude: string; street?: { name?: string } };
          month: string;
          outcome_status?: { category?: string } | null;
        }[]
      >(
        `https://data.police.uk/api/crimes-street/all-crime?lat=${data.lat.toFixed(5)}&lng=${data.lng.toFixed(5)}`,
        25_000,
      );
      const points = raw
        .map((c) => ({
          category: c.category.replace(/-/g, " "),
          street: c.location.street?.name ?? "Location approximated by Police.uk",
          lat: Number(c.location.latitude),
          lng: Number(c.location.longitude),
          month: c.month,
          outcome: c.outcome_status?.category ?? null,
        }))
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
      return { points, month: points[0]?.month ?? null, error: null };
    } catch (e) {
      return { points: [], month: null, error: (e as Error).message };
    }
  });

export interface TaxWelfarePoint {
  year: string;
  receipts: number | null;
  welfare: number | null;
}

/** Published annual public sector receipts against the published welfare bill. */
export const getTaxVsWelfare = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    points: TaxWelfarePoint[];
    asOf: string | null;
    nextDue: string | null;
  }> => {
    const receiptsUri = "/economy/governmentpublicsectorandtaxes/publicsectorfinance/timeseries/anbt/pusf";
    const welfareUri = "/economy/governmentpublicsectorandtaxes/publicsectorfinance/timeseries/anly/pusf";
    const [receipts, welfare, nextDue] = await Promise.all([
      onsSeries(receiptsUri),
      onsSeries(welfareUri),
      onsNextRelease("Public sector finances"),
    ]);
    const map = new Map<string, TaxWelfarePoint>();
    for (const p of receipts.years ?? []) {
      if (p.value === "") continue;
      map.set(p.label, { year: p.label, receipts: Number(p.value), welfare: null });
    }
    for (const p of welfare.years ?? []) {
      if (p.value === "") continue;
      const row = map.get(p.label) ?? { year: p.label, receipts: null, welfare: null };
      row.welfare = Number(p.value);
      map.set(p.label, row);
    }
    const points = [...map.values()].sort((a, b) => a.year.localeCompare(b.year));
    const asOf =
      (receipts.years ?? []).slice(-1)[0]?.updateDate ?? (welfare.years ?? []).slice(-1)[0]?.updateDate ?? null;
    return { points, asOf, nextDue };
  },
);
