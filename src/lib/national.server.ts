// Server-only fetchers for Wave 2 national publishers. Any failure → no figure, never a guess.
import { countryByCode, type CountryMetric } from "@/lib/countries";
import { noFeed, parseBls, parseSdmxCsv, parseStatCan, yoyFromIndex, type Pt } from "@/lib/national";

const TTL = 30 * 60_000;
const cache = new Map<string, { at: number; p: Promise<CountryMetric> }>();

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
        return { pts, asOf: pts.at(-1)?.time };
      } },
    { id: "us-cpi", title: "Inflation (CPI-U, 12-month change)", cadence: "Monthly", source: "Bureau of Labor Statistics (CUUR0000SA0)", sourceUrl: "https://data.bls.gov/timeseries/CUUR0000SA0", next: "Per BLS CPI release schedule", fmt: pct,
      load: async () => ({ pts: yoyFromIndex(await bls("CUUR0000SA0")()) }) },
    { id: "us-unemployment", title: "Unemployment rate", cadence: "Monthly", source: "Bureau of Labor Statistics (LNS14000000)", sourceUrl: "https://data.bls.gov/timeseries/LNS14000000", next: "Per BLS Employment Situation schedule", fmt: pct,
      load: async () => ({ pts: await bls("LNS14000000")() }) },
    { id: "us-effr", title: "Effective federal funds rate", cadence: "Daily (business days)", source: "Federal Reserve Bank of New York", sourceUrl: "https://www.newyorkfed.org/markets/reference-rates/effr", next: "Next business day", fmt: rate,
      load: async () => {
        const js = (await (await get("https://markets.newyorkfed.org/api/rates/unsecured/effr/last/30.json")).json()) as { refRates: { effectiveDate: string; percentRate: number }[] };
        const pts = js.refRates.map((r) => ({ time: r.effectiveDate, value: r.percentRate })).reverse();
        return { pts, asOf: pts.at(-1)?.time };
      } },
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
        return { pts, asOf: pts.at(-1)?.time };
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
  const p = d.load().then(
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

export async function nationalMetrics(code: string): Promise<CountryMetric[]> {
  const live = await Promise.all([...(DEFS[code] ?? []), ...(countryByCode(code)?.euro ? [ecbRate] : [])].map((d) => run(code, d)));
  return [...live, ...(NO_FEED[code] ?? [])];
}
