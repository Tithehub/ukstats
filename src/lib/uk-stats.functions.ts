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

/** Current national threat level, parsed live from the GOV.UK page maintained with JTAC/MI5. */
async function threatLevel(): Promise<Metric> {
  const base: Metric = {
    id: "uk-threat-level",
    category: "Defence & security",
    title: "National terrorism threat level",
    source: "MI5 / JTAC via GOV.UK",
    sourceUrl: "https://www.gov.uk/terrorism-national-emergency",
    value: null,
    sub: "Set by the Joint Terrorism Analysis Centre and MI5",
    period: null,
    asOf: null,
    nextDue: null,
    cadence: "Reviewed continuously; can change without notice",
    change: null,
    spark: [],
    status: "unavailable",
    note: null,
  };
  try {
    const c = await getJson<
      GovukContent & { details?: { parts?: { body: string }[] } }
    >("https://www.gov.uk/api/content/terrorism-national-emergency");
    const body = (c.details?.parts ?? []).map((p) => p.body).join(" ");
    const text = stripTags(body);
    const uk = /threat to the UK[^.]*from terrorism is (\w+)/i.exec(text);
    const ni = /threat to Northern Ireland[^.]*is (\w+)/i.exec(text);
    if (!uk) return base;
    const level = uk[1]!.toLowerCase();
    return {
      ...base,
      value: level.charAt(0).toUpperCase() + level.slice(1),
      sub: ni ? `Northern Ireland-related threat: ${ni[1]!.toLowerCase()}` : base.sub,
      period: "Current",
      asOf: c.public_updated_at ?? null,
      status: "ok",
      note: "Five levels: low, moderate, substantial, severe, critical. Levels have no expiry date, so 'age' here is the date the official page last changed.",
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
    immigrationSystem(),
    legalImmigration(),
    defenceSpend(),
    threatLevel(),
    irregularCost(),

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
