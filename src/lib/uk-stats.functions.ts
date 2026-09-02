import { createServerFn } from "@tanstack/react-start";
import type { Metric, StatsPayload } from "./uk-stats";

const UA = { "user-agent": "uk-national-data-register/1.0 (+aggregator)" };

async function getJson<T>(url: string, ms = 20_000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { headers: { accept: "application/json", ...UA }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
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

async function onsNextRelease(query: string): Promise<string | null> {
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
}

async function onsMetric(opts: {
  id: string;
  category: Metric["category"];
  title: string;
  uri: string;
  releaseQuery: string;
  cadence: string;
  format: (v: number) => string;
  changeUnit: string;
  sub?: string;
  frequency?: "months" | "quarters";
}): Promise<Metric> {
  const base: Metric = {
    id: opts.id,
    category: opts.category,
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
  };
  try {
    const [series, nextDue] = await Promise.all([
      getJson<OnsSeries>(`https://api.beta.ons.gov.uk/v1/data?uri=${opts.uri}`),
      onsNextRelease(opts.releaseQuery),
    ]);
    const freq = opts.frequency ?? "months";
    const points = (series[freq] ?? series.quarters ?? series.years ?? []).filter((p) => p.value !== "");
    const last = points[points.length - 1];
    if (!last) return { ...base, note: "Source returned no observations." };
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
      change:
        delta === null
          ? null
          : {
              label: `${delta > 0 ? "▲" : delta < 0 ? "▼" : "■"} ${Math.abs(delta).toFixed(1)}${opts.changeUnit} vs previous`,
              dir: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
            },
      status: "ok",
    };
  } catch (e) {
    return { ...base, note: `Source unreachable: ${(e as Error).message}` };
  }
}

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
    category: "Immigration",
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
  const daily = mk("uk-small-boats-daily", "Small boat arrivals, latest day", "Migrants detected crossing the Channel");
  const weekly = mk("uk-small-boats-week", "Small boat arrivals, last 7 days", "Rolling seven-day published total");
  try {
    const data = await getJson<GovukContent>(url);
    const body = data.details?.body ?? "";
    const rows = [...body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)]
      .map((r) =>
        [...r[1]!.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) =>
          c[1]!.replace(/<[^>]+>/g, "").trim(),
        ),
      )
      .filter((cells) => cells.length >= 3 && /\d{4}$/.test(cells[0] ?? ""));
    if (!rows.length) throw new Error("no data rows in published table");
    const series = rows.map((c) => ({ date: c[0]!, arrivals: Number((c[1] ?? "").replace(/,/g, "")) }));
    const last = series[series.length - 1]!;
    const prev = series[series.length - 2];
    const total = series.reduce((a, b) => a + (Number.isFinite(b.arrivals) ? b.arrivals : 0), 0);
    const asOf = data.public_updated_at ?? null;
    const nextDue = asOf ? new Date(new Date(asOf).getTime() + 86_400_000).toISOString() : null;
    const delta = prev ? last.arrivals - prev.arrivals : null;
    return [
      {
        ...daily,
        value: last.arrivals.toLocaleString("en-GB"),
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
        value: total.toLocaleString("en-GB"),
        period: `${series[0]!.date} – ${last.date}`,
        asOf,
        nextDue,
        spark: series.map((s) => s.arrivals),
        status: "ok",
        note: "Sum of the seven daily figures exactly as published; no smoothing or estimation.",
      },
    ];
  } catch (e) {
    const note = `Source unreachable: ${(e as Error).message}`;
    return [
      { ...daily, note },
      { ...weekly, note },
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

/* ------------------- GOV.UK publication-tracked reference cards -------------- */

async function govukTracked(opts: {
  id: string;
  category: Metric["category"];
  title: string;
  sub: string;
  path: string;
  source: string;
  cadence: string;
  note: string;
  announcementQuery?: string;
}): Promise<Metric> {
  const base: Metric = {
    id: opts.id,
    category: opts.category,
    title: opts.title,
    source: opts.source,
    sourceUrl: `https://www.gov.uk${opts.path}`,
    value: null,
    sub: opts.sub,
    period: null,
    asOf: null,
    nextDue: null,
    cadence: opts.cadence,
    change: null,
    spark: [],
    status: "no-feed",
    note: opts.note,
  };
  try {
    const [content, announced] = await Promise.all([
      getJson<GovukContent>(`https://www.gov.uk/api/content${opts.path}`).catch(() => null),
      opts.announcementQuery
        ? getJson<{ results: { release_timestamp: string }[] }>(
            `https://www.gov.uk/api/search.json?filter_format=statistics_announcement&q=${encodeURIComponent(opts.announcementQuery)}&count=10&fields=release_timestamp&order=release_timestamp`,
          ).catch(() => null)
        : Promise.resolve(null),
    ]);
    const upcoming = (announced?.results ?? [])
      .map((r) => r.release_timestamp)
      .filter((d) => d && new Date(d).getTime() > Date.now())
      .sort();
    return {
      ...base,
      asOf: content?.public_updated_at ?? null,
      nextDue: upcoming[0] ?? null,
    };
  } catch {
    return base;
  }
}

/* ---------------------------------- assembly -------------------------------- */

export const getUkStats = createServerFn({ method: "GET" }).handler(async (): Promise<StatsPayload> => {
  const tasks: Promise<Metric | Metric[]>[] = [
    onsMetric({
      id: "uk-national-debt",
      category: "Finance",
      title: "UK public sector net debt",
      uri: "/economy/governmentpublicsectorandtaxes/publicsectorfinance/timeseries/hf6w/pusf",
      releaseQuery: "Public sector finances",
      cadence: "Monthly, around the 21st",
      format: (v) => `£${v.toLocaleString("en-GB", { maximumFractionDigits: 1 })}bn`,
      changeUnit: "bn",
      sub: "Excluding public sector banks, not seasonally adjusted",
    }),
    onsMetric({
      id: "uk-debt-gdp",
      category: "Finance",
      title: "Net debt as a share of GDP",
      uri: "/economy/governmentpublicsectorandtaxes/publicsectorfinance/timeseries/hf6x/pusf",
      releaseQuery: "Public sector finances",
      cadence: "Monthly, around the 21st",
      format: (v) => `${v.toFixed(1)}%`,
      changeUnit: "pp",
      sub: "Excluding public sector banks",
    }),
    onsMetric({
      id: "uk-cpi",
      category: "Cost of living",
      title: "CPI inflation, annual rate",
      uri: "/economy/inflationandpriceindices/timeseries/d7g7/mm23",
      releaseQuery: "Consumer price inflation",
      cadence: "Monthly, mid-month",
      format: (v) => `${v.toFixed(1)}%`,
      changeUnit: "pp",
      sub: "All items, 12-month rate",
    }),
    onsMetric({
      id: "uk-cpih",
      category: "Cost of living",
      title: "CPIH inflation, annual rate",
      uri: "/economy/inflationandpriceindices/timeseries/l55o/mm23",
      releaseQuery: "Consumer price inflation",
      cadence: "Monthly, mid-month",
      format: (v) => `${v.toFixed(1)}%`,
      changeUnit: "pp",
      sub: "All items including owner occupiers' housing costs",
    }),
    onsMetric({
      id: "uk-unemployment",
      category: "Finance",
      title: "Unemployment rate",
      uri: "/employmentandlabourmarket/peoplenotinwork/unemployment/timeseries/mgsx/lms",
      releaseQuery: "Labour market overview",
      cadence: "Monthly, rolling three-month estimate",
      format: (v) => `${v.toFixed(1)}%`,
      changeUnit: "pp",
      sub: "Aged 16 and over, seasonally adjusted",
    }),
    onsMetric({
      id: "uk-gdp",
      category: "Finance",
      title: "GDP growth, quarter on quarter",
      uri: "/economy/grossdomesticproductgdp/timeseries/ihyq/pn2",
      releaseQuery: "GDP quarterly national accounts",
      cadence: "Quarterly",
      format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`,
      changeUnit: "pp",
      sub: "Chained volume measure, seasonally adjusted",
      frequency: "quarters",
    }),
    housePrices(),
    crime(),
    smallBoats(),
    weather(),
    govukTracked({
      id: "uk-irregular-migration",
      category: "Immigration",
      title: "Irregular migration to the UK",
      sub: "Detected irregular arrivals by route",
      path: "/government/collections/irregular-migration-to-the-uk-statistics",
      source: "Home Office",
      cadence: "Quarterly official statistics",
      note: "The Home Office publishes this only as spreadsheets, with no machine-readable feed. Publication dates are tracked live; figures are not restated here so nothing can be misquoted.",
      announcementQuery: "Irregular migration to the UK",
    }),
    govukTracked({
      id: "uk-asylum-cost",
      category: "Immigration",
      title: "Cost of the asylum system",
      sub: "Asylum support and accommodation spend",
      path: "/government/collections/immigration-statistics-quarterly-release",
      source: "Home Office annual report and accounts",
      cadence: "Annual, with quarterly context releases",
      note: "No live API exists for asylum and accommodation spend. Any single running 'cost' figure circulating online is an estimate, so this register links the audited source instead of publishing one.",
      announcementQuery: "Immigration system statistics",
    }),
    govukTracked({
      id: "uk-defence-spend",
      category: "Defence & security",
      title: "MOD departmental resources",
      sub: "Defence expenditure and personnel",
      path: "/government/collections/departmental-resources",
      source: "Ministry of Defence",
      cadence: "Annual official statistics",
      note: "MOD publishes departmental resources as statistical spreadsheets only. Release timing is tracked here; the figures stay at the source.",
      announcementQuery: "MOD departmental resources",
    }),
    govukTracked({
      id: "uk-threat-level",
      category: "Defence & security",
      title: "National terrorism threat level",
      sub: "Set by the Joint Terrorism Analysis Centre and MI5",
      path: "/terrorism-national-emergency-planning",
      source: "MI5 / Home Office",
      cadence: "Reviewed continuously; changed without notice",
      note: "The threat level is a published judgement, not a dataset. This card tracks when the official page last changed — read the current level at the source.",
    }),
  ];

  const settled = await Promise.allSettled(tasks);
  const metrics: Metric[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") {
      if (Array.isArray(r.value)) metrics.push(...r.value);
      else metrics.push(r.value);
    }
  }
  return { metrics, fetchedAt: new Date().toISOString() };
});
