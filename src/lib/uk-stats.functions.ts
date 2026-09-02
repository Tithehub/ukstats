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
    threatLevels(),
    metOfficeWarnings(),
    floodWarnings(),
    healthAlerts(),
    airQuality(),

    irregularCost(),
    smallBoatDemographics(),
    recordedCrime(),
    sexualOffences(),


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
    const landing = await getJson<{
      datasets?: { uri: string }[];
      description?: { nextRelease?: string };
    }>(`https://www.ons.gov.uk${CRIME_DATASET}/data`);
    const versionUri = landing.datasets?.[0]?.uri;
    if (!versionUri) return [];

    const version = await getJson<{
      downloads?: { file: string }[];
      description?: { releaseDate?: string };
    }>(`https://www.ons.gov.uk${versionUri}/data`);
    const file = version.downloads?.[0]?.file;
    if (!file) return [];

    const { unzipSync, strFromU8 } = await import("fflate");
    const files = unzipSync(
      await getBytes(`https://www.ons.gov.uk/file?uri=${versionUri}/${file}`, 40_000),
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
  } catch {
    return [];
  }
}
