// Server-only fetchers for Wave 2 national publishers. Any failure → no figure, never a guess.
import { mainEvent, parseCapFeed, worstColour } from "@/lib/alerts";
import { countryByCode, PLACES, type CountryMetric } from "@/lib/countries";
import { noFeed, parseBls, parseSdmxCsv, parseStatCan, yoyFromIndex, type Pt } from "@/lib/national";

const TTL = 30 * 60_000;
const WEATHER_TTL = 15 * 60_000;
const ALERTS_TTL = 10 * 60_000;
const cache = new Map<string, { at: number; p: Promise<CountryMetric> }>();

function cached<T>(store: Map<string, { at: number; p: Promise<T> }>, key: string, ttl: number, make: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.p;
  const p = make();
  p.catch(() => store.delete(key));
  store.set(key, { at: Date.now(), p });
  return p;
}

async function get(url: string, init: RequestInit = {}): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal, headers: { "user-agent": "ukstats-register/1.0", ...(init.headers ?? {}) } });
    if (!res.ok) throw new Error(`${res.status}`);
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function getJson<T>(url: string): Promise<T> {
  return (await (await get(url)).json()) as T;
}

type Def = { id: string; title: string; cadence: string; source: string; sourceUrl: string; next: string; fmt: (v: number) => string; load: () => Promise<{ pts: Pt[]; asOf?: string | null }> };

const pct = (v: number) => `${v.toFixed(1)}%`;
const rate = (v: number) => `${v.toFixed(2)}%`;
const statcan = (vector: number) => async () => {
  const js = await (await get("https://www150.statcan.gc.ca/t1/wds/rest/getDataFromVectorsAndLatestNPeriods", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify([{ vectorId: vector, latestN: 25 }]) })).json();
  return parseStatCan(js, vector);
};
const bls = (series: string) => async () => parseBls(await (await get(`https://api.bls.gov/publicAPI/v1/timeseries/data/${series}`)).json());

const ecbRate: Def = {
  id: "ecb-rate", title: "ECB deposit facility rate", cadence: "Set at ECB monetary policy meetings", source: "European Central Bank", fmt: rate,
  sourceUrl: "https://data.ecb.europa.eu/data/datasets/FM/FM.B.U2.EUR.4F.KR.DFR.LEV", next: "Next ECB monetary policy meeting",
  load: async () => ({ pts: parseSdmxCsv(await (await get("https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.DFR.LEV?lastNObservations=12&format=csvdata")).text()) }),
};

const DEFS: Record<string, Def[]> = {
  us: [
    { id: "us-debt", title: "Total public debt outstanding (US Treasury)", cadence: "Daily (business days)", source: "US Treasury — Debt to the Penny", sourceUrl: "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/", next: "Next business day",
      fmt: (v) => `$${(v / 1e12).toFixed(3)} trillion`,
      load: async () => {
        const js = (await (await get("https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page%5Bsize%5D=30")).json()) as { data: { record_date: string; tot_pub_debt_out_amt: string }[] };
        const pts = js.data.map((r) => ({ time: r.record_date, value: Number(r.tot_pub_debt_out_amt) })).filter((p) => Number.isFinite(p.value)).reverse();
        return { pts };
      } },
    { id: "us-cpi", title: "Inflation (CPI-U, 12-month change)", cadence: "Monthly", source: "Bureau of Labor Statistics (CUUR0000SA0)", sourceUrl: "https://data.bls.gov/timeseries/CUUR0000SA0", next: "Per BLS CPI release schedule", fmt: pct,
      load: async () => ({ pts: yoyFromIndex(await bls("CUUR0000SA0")()) }) },
    { id: "us-unemployment", title: "Unemployment rate", cadence: "Monthly", source: "Bureau of Labor Statistics (LNS14000000)", sourceUrl: "https://data.bls.gov/timeseries/LNS14000000", next: "Per BLS Employment Situation schedule", fmt: pct,
      load: async () => ({ pts: await bls("LNS14000000")() }) },
    { id: "us-effr", title: "Effective federal funds rate", cadence: "Daily (business days)", source: "Federal Reserve Bank of New York", sourceUrl: "https://www.newyorkfed.org/markets/reference-rates/effr", next: "Next business day", fmt: rate,
      load: async () => {
        const js = (await (await get("https://markets.newyorkfed.org/api/rates/unsecured/effr/last/30.json")).json()) as { refRates: { effectiveDate: string; percentRate: number }[] };
        const pts = js.refRates.map((r) => ({ time: r.effectiveDate, value: r.percentRate })).reverse();
        return { pts };
      } },
    { id: "us-payrolls", title: "Nonfarm payroll employment (thousands)", cadence: "Monthly", source: "Bureau of Labor Statistics (CES0000000001)", sourceUrl: "https://data.bls.gov/timeseries/CES0000000001", next: "Per BLS Employment Situation schedule", fmt: (v) => `${Math.round(v).toLocaleString("en-GB")}k`,
      load: async () => ({ pts: await bls("CES0000000001")() }) },
    { id: "us-earnings", title: "Average hourly earnings, private sector", cadence: "Monthly", source: "Bureau of Labor Statistics (CES0500000003)", sourceUrl: "https://data.bls.gov/timeseries/CES0500000003", next: "Per BLS Employment Situation schedule", fmt: (v) => `$${v.toFixed(2)}`,
      load: async () => ({ pts: await bls("CES0500000003")() }) },
    ...([["V", "Violent crime offences (month)"], ["P", "Property crime offences (month)"]] as const).map(([code, title]): Def => ({
      id: `us-crime-${code === "V" ? "violent" : "property"}`, title, cadence: "Monthly, published with a lag", source: "FBI Crime Data Explorer (UCR summarized)", sourceUrl: "https://cde.ucr.cjis.gov/", next: "Per FBI CDE update schedule", fmt: (v) => Math.round(v).toLocaleString("en-GB"),
      load: async () => {
        const key = process.env["FBI_API_KEY"];
        if (!key) throw new Error("FBI key not configured");
        const y = new Date().getUTCFullYear();
        const js = await getJson<{ offenses?: { actuals?: Record<string, Record<string, number | null>> } }>(`https://api.usa.gov/crime/fbi/cde/summarized/national/${code}?from=01-${y - 2}&to=12-${y}&API_KEY=${encodeURIComponent(key)}`);
        const series = Object.entries(js.offenses?.actuals ?? {}).find(([k]) => /united states/i.test(k) && !/clearance/i.test(k))?.[1] ?? {};
        const pts = Object.entries(series).filter(([, v]) => typeof v === "number" && Number.isFinite(v)).map(([mmYYYY, v]) => { const [m, yr] = mmYYYY.split("-"); return { time: `${yr}-${m}`, value: v as number }; }).sort((a, b) => a.time.localeCompare(b.time));
        // Agencies report late, so recent months are badly incomplete. Only show months at least 12 months old.
        const cut = new Date(); cut.setUTCMonth(cut.getUTCMonth() - 12);
        const cutoff = cut.toISOString().slice(0, 7);
        return { pts: pts.filter((p) => p.time <= cutoff) };
      },
    })),
  ],
  ca: [
    { id: "ca-cpi", title: "Inflation (CPI, 12-month change)", cadence: "Monthly", source: "Statistics Canada (v41690973)", sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000401", next: "Per Statistics Canada release schedule", fmt: pct,
      load: async () => ({ pts: yoyFromIndex(await statcan(41690973)()) }) },
    { id: "ca-unemployment", title: "Unemployment rate", cadence: "Monthly", source: "Statistics Canada Labour Force Survey (v2062815)", sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410028701", next: "Per Statistics Canada release schedule", fmt: pct,
      load: async () => ({ pts: await statcan(2062815)() }) },
    { id: "ca-rate", title: "Bank of Canada policy rate", cadence: "Set at fixed announcement dates", source: "Bank of Canada (V39079)", sourceUrl: "https://www.bankofcanada.ca/rates/interest-rates/key-interest-rate/", next: "Next scheduled rate announcement", fmt: rate,
      load: async () => {
        const js = (await (await get("https://www.bankofcanada.ca/valet/observations/V39079/json?recent=30")).json()) as { observations: { d: string; V39079?: { v: string } }[] };
        const pts = js.observations.map((o) => ({ time: o.d, value: Number(o.V39079?.v) })).filter((p) => Number.isFinite(p.value)).sort((a, b) => a.time.localeCompare(b.time));
        return { pts };
      } },
  ],
  au: [
    { id: "au-unemployment", title: "Unemployment rate (seasonally adjusted)", cadence: "Monthly", source: "Australian Bureau of Statistics — Labour Force", sourceUrl: "https://www.abs.gov.au/statistics/labour/employment-and-unemployment/labour-force-australia/latest-release", next: "Per ABS release calendar", fmt: pct,
      load: async () => ({ pts: parseSdmxCsv(await (await get("https://data.api.abs.gov.au/rest/data/ABS,LF,1.0.0/M13.3.1599.20.AUS.M?startPeriod=2024-01", { headers: { accept: "application/vnd.sdmx.data+csv" } })).text()) }) },
  ],

};

const NO_FEED: Record<string, CountryMetric[]> = {
  us: [
    noFeed("us-border", "Southwest land border encounters", "US Customs and Border Protection", "https://www.cbp.gov/newsroom/stats/southwest-land-border-encounters", "CBP publishes this as an interactive dashboard and files without a stable machine-readable feed. See the official page."),
    noFeed("us-crime", "Reported violent crime", "FBI Crime Data Explorer", "https://cde.ucr.cjis.gov/", "The FBI's crime data API needs a registered key; figures are yearly. See the official explorer."),
  ],
  ca: [noFeed("ca-asylum", "Asylum claimants", "Immigration, Refugees and Citizenship Canada", "https://www.canada.ca/en/immigration-refugees-citizenship/services/refugees/asylum-claims/processed-claims.html", "IRCC publishes asylum claims as monthly tables, not a live feed.")],
  au: [
    noFeed("au-cpi", "Inflation (CPI)", "Australian Bureau of Statistics", "https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation", "The ABS data service returned no records for the CPI series we checked, so no figure is shown."),
    noFeed("au-rate", "RBA cash rate target", "Reserve Bank of Australia", "https://www.rba.gov.au/statistics/cash-rate/", "The RBA blocks automated download of its statistical tables. See the official page."),
    noFeed("au-boats", "Illegal maritime arrivals", "Operation Sovereign Borders (Home Affairs)", "https://www.osb.homeaffairs.gov.au/news-media/monthly-updates", "Published as monthly PDF updates only."),
  ],
  fr: [
    noFeed("fr-crime", "Recorded crime (national)", "Ministère de l'Intérieur — SSMSI", "https://www.interieur.gouv.fr/Interstats", "SSMSI publishes yearly and monthly reports; no stable live feed."),
    noFeed("fr-asylum", "Asylum applications (OFPRA)", "OFPRA", "https://www.ofpra.gouv.fr/libraries/chiffres-cles", "Published in the OFPRA annual report. The EU-harmonised monthly figure is shown above."),
  ],
  de: [
    noFeed("de-crime", "Recorded crime (PKS)", "Bundeskriminalamt — Polizeiliche Kriminalstatistik", "https://www.bka.de/DE/AktuelleInformationen/StatistikenLagebilder/PolizeilicheKriminalstatistik/pks_node.html", "Published yearly as tables and reports."),
    noFeed("de-asylum", "Asylum applications (BAMF)", "Bundesamt für Migration und Flüchtlinge", "https://www.bamf.de/DE/Themen/Statistik/Asylzahlen/asylzahlen-node.html", "Published as monthly PDFs. The EU-harmonised monthly figure is shown above."),
  ],
  ie: [
    noFeed("ie-crime", "Recorded crime offences", "Central Statistics Office", "https://www.cso.ie/en/statistics/crimeandjustice/", "CSO publishes recorded crime 'under reservation' quarterly; not yet wired in."),
  ],
};

function run(code: string, d: Def): Promise<CountryMetric> {
  const key = `${code}:${d.id}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.p;
  const base: CountryMetric = { id: d.id, title: d.title, value: null, period: null, asOf: null, cadence: d.cadence, source: d.source, sourceUrl: d.sourceUrl, spark: [], raw: null, note: null, next: d.next, status: "unavailable", history: [], calendarUrl: d.sourceUrl };
  const p: Promise<CountryMetric> = d.load().then<CountryMetric, CountryMetric>(
    ({ pts, asOf }) => {
      const last = pts.at(-1);
      if (!last) return { ...base, note: "The publisher returned no figure for this series." };
      return { ...base, value: d.fmt(last.value), raw: last.value, period: last.time, asOf: asOf ?? null, spark: pts.slice(-24).map((x) => x.value), status: "ok", history: pts.map(x => ({ ...x, formatted: d.fmt(x.value) })) };
    },
    () => {
      cache.delete(key);
      return { ...base, note: "Publisher feed unreachable just now — no figure shown rather than a guess." };
    },
  );
  cache.set(key, { at: Date.now(), p });
  return p;
}

/* --------------------------------- Weather --------------------------------- */

const WEATHER_SOURCE = "Open-Meteo weather model (not an official statistic)";
const WEATHER_URL = "https://open-meteo.com/";
const wcache = new Map<string, { at: number; p: Promise<CountryMetric[]> }>();

function weatherMetrics(code: string): Promise<CountryMetric[]> {
  return cached(wcache, code, WEATHER_TTL, async () => {
    const place = PLACES[code];
    const mk = (id: string, title: string, sub: string, cadence: string): CountryMetric => ({
      id, title, category: "Weather", value: null, period: null, asOf: null, cadence,
      source: WEATHER_SOURCE, sourceUrl: WEATHER_URL, spark: [], history: [], raw: null,
      note: place ? sub : "No capital is registered for this country.", status: "unavailable",
      next: "Model refreshes hourly", calendarUrl: WEATHER_URL,
    });
    const today = mk(`${code}-temp-today`, `${place?.city ?? "Local"} temperature, today`, "Daily mean from the weather model", "Hourly model refresh");
    const hist = mk(`${code}-temp-30d`, `${place?.city ?? "Local"} temperature, 30-day mean`, "Archive reanalysis, daily means", "Daily, two days in arrears");
    if (!place) return [today, hist];
    const start = new Date(Date.now() - 32 * 86_400_000).toISOString().slice(0, 10);
    const end = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
    try {
      const [fc, ar] = await Promise.all([
        getJson<{ daily: { time: string[]; temperature_2m_mean: number[]; temperature_2m_max: number[]; temperature_2m_min: number[] } }>(`https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min&timezone=${encodeURIComponent(place.tz)}&forecast_days=7`),
        getJson<{ daily: { time: string[]; temperature_2m_mean: (number | null)[] } }>(`https://archive-api.open-meteo.com/v1/archive?latitude=${place.lat}&longitude=${place.lon}&start_date=${start}&end_date=${end}&daily=temperature_2m_mean&timezone=${encodeURIComponent(place.tz)}`),
      ]);
      const mean = fc.daily.temperature_2m_mean?.[0];
      const hi = fc.daily.temperature_2m_max?.[0];
      const lo = fc.daily.temperature_2m_min?.[0];
      const arch = (ar.daily.temperature_2m_mean ?? []).filter((n): n is number => typeof n === "number");
      const avg = arch.length ? arch.reduce((a, b) => a + b, 0) / arch.length : null;
      return [
        {
          ...today,
          value: mean === undefined ? null : `${mean.toFixed(1)}°C`,
          raw: mean ?? null,
          period: fc.daily.time?.[0] ?? null,
          asOf: new Date().toISOString(),
          spark: fc.daily.temperature_2m_mean ?? [],
          status: mean === undefined ? "unavailable" : "ok",
          note: hi === undefined || lo === undefined ? null : `Model high ${hi.toFixed(1)}°C, low ${lo.toFixed(1)}°C. A weather model, not an official statistic.`,
        },
        {
          ...hist,
          value: avg === null ? null : `${avg.toFixed(1)}°C`,
          raw: avg,
          period: arch.length ? `${ar.daily.time[0]} – ${ar.daily.time[ar.daily.time.length - 1]}` : null,
          asOf: new Date(Date.now() - 2 * 86_400_000).toISOString(),
          spark: arch,
          history: arch.map((v, i) => ({ time: ar.daily.time[i] ?? "", value: v, formatted: `${v.toFixed(1)}°C` })),
          status: avg === null ? "unavailable" : "ok",
          note: avg === null ? null : "Mean of the last 30 published daily means. A weather model, not an official statistic.",
        },
      ];
    } catch (e) {
      const note = `Weather model unreachable just now (${e instanceof Error ? e.message : "no response"}) — no figure shown rather than a guess.`;
      return [{ ...today, note }, { ...hist, note }];
    }
  });
}

/* ------------------------- Official weather warnings ------------------------ */

const ALERTS_SOURCE = "Meteoalarm — national weather-service warnings (EUMETNET)";
const ALERTS_URL = "https://meteoalarm.org";
const acache = new Map<string, { at: number; p: Promise<CountryMetric> }>();

function alertsMetric(code: string): Promise<CountryMetric> {
  return cached(acache, code, ALERTS_TTL, async () => {
    const place = PLACES[code];
    const source = place?.alertSlug ? ALERTS_SOURCE : (place?.alertSource ?? "National weather service");
    const sourceUrl = place?.alertSlug ? ALERTS_URL : (place?.alertUrl ?? ALERTS_URL);
    const base: CountryMetric = {
      id: `${code}-alerts`, title: "Official weather warnings in force", category: "National alerts",
      value: null, period: null, asOf: null, cadence: "Issued as warnings are made", source, sourceUrl,
      spark: [], history: [], raw: null, note: null, status: "unavailable",
      next: "Feed updates whenever a warning is issued", calendarUrl: sourceUrl,
    };
    if (!place?.alertSlug) {
      return {
        ...base, status: "no-feed",
        note: "No machine-readable warning feed is integrated for this country yet. See the national weather service for current warnings.",
      };
    }
    try {
      const xml = await (await get(`https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-${place.alertSlug}`)).text();
      const alerts = parseCapFeed(xml);
      const worst = worstColour(alerts);
      const main = mainEvent(alerts);
      return {
        ...base,
        value: alerts.length ? `${alerts.length} in force` : "None in force",
        raw: alerts.length,
        asOf: new Date().toISOString(),
        status: "ok",
        note: alerts.length
          ? [worst ? `Highest level: ${worst}.` : null, main ? `Most common: ${main.event} (${main.areas} area${main.areas > 1 ? "s" : ""}).` : null].filter(Boolean).join(" ")
          : "No official weather warning is in force for this country right now.",
      };
    } catch (e) {
      return { ...base, note: `Warning feed unreachable just now (${e instanceof Error ? e.message : "no response"}) — no figure shown rather than a guess.` };
    }
  });
}

export async function nationalMetrics(code: string): Promise<CountryMetric[]> {
  const country = countryByCode(code);
  const [live, weather, alerts] = await Promise.all([
    Promise.all([...(DEFS[code] ?? []), ...(country?.euro ? [ecbRate] : [])].map((d) => run(code, d))),
    weatherMetrics(code),
    alertsMetric(code),
  ]);
  return [...live, ...weather, alerts, ...(NO_FEED[code] ?? [])];
}
