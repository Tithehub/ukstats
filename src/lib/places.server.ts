/**
 * Builds payload_cache "places-v1": one row per UK local authority with the
 * official figures behind the Happiest places page and the unofficial move
 * comparison. Every figure is read from its publisher; nothing is estimated.
 */
import { parseWellbeingCsv, splitCsvLine, isLaCode, nationOf, normName, type Place, type PlacesPayload } from "./places";

export const PLACES_CACHE_ID = "places-v1";
const UA = { "user-agent": "UKStats/1.0 (+https://ukstats.co.uk)" };
const WB_API = "https://api.beta.ons.gov.uk/v1/datasets/wellbeing-local-authority";
const NOMIS = "https://www.nomisweb.co.uk/api/v01/dataset";
const HPI_SPARQL = "https://landregistry.data.gov.uk/landregistry/query";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as { from: (t: string) => any; rpc: (f: string) => any };
}
async function get(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, headers: { ...UA, ...(init?.headers ?? {}) } });
  if (!r.ok) { await r.body?.cancel(); throw new Error(`${r.status} ${url.slice(0, 80)}`); }
  return r;
}
const csvRows = (t: string) => t.split(/\r?\n/).filter(Boolean).slice(1).map(splitCsvLine);

async function fetchWellbeing() {
  const meta = await (await get(WB_API)).json() as { links?: { latest_version?: { href?: string } } };
  const vHref = meta.links?.latest_version?.href;
  if (!vHref) throw new Error("no wellbeing version");
  const v = await (await get(vHref)).json() as { release_date?: string; downloads?: { csv?: { href?: string } } };
  const csv = v.downloads?.csv?.href;
  if (!csv) throw new Error("no wellbeing csv");
  const table = parseWellbeingCsv(await (await get(csv)).text());
  return { ...table, released: v.release_date?.slice(0, 10) ?? null };
}

async function fetchPay() {
  const t = await (await get(`${NOMIS}/NM_30_1.data.csv?geography=TYPE424&date=latest&sex=8&item=2&pay=1&measures=20100&select=date_name,geography_code,geography_name,obs_value`)).text();
  const map = new Map<string, { name: string; v: number }>(); let year = "";
  for (const r of csvRows(t)) { const v = Number(r[3]); year = r[0] ?? year; if (r[1] && r[3] && Number.isFinite(v)) map.set(r[1], { name: r[2] ?? r[1], v }); }
  return { map, year };
}

async function fetchPopulation() {
  const t = await (await get(`${NOMIS}/NM_2002_1.data.csv?geography=TYPE424&date=latest&gender=0&c_age=200,209&measures=20100&select=date_name,geography_code,geography_name,c_age_name,obs_value`)).text();
  const all = new Map<string, number>(), old = new Map<string, number>(), names = new Map<string, string>(); let year = "";
  for (const r of csvRows(t)) {
    const code = r[1] ?? "", v = Number(r[4]); year = r[0] ?? year;
    if (!Number.isFinite(v)) continue;
    names.set(code, r[2] ?? code);
    if (/all ages/i.test(r[3] ?? "")) all.set(code, v); else old.set(code, v);
  }
  const share = new Map<string, number>();
  for (const [c, a] of all) { const o = old.get(c); if (o != null && a > 0) share.set(c, Math.round((o / a) * 1000) / 10); }
  return { share, names, year };
}

async function fetchHpi() {
  const post = async (q: string) => (await get(HPI_SPARQL, { method: "POST", headers: { accept: "text/csv", "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ query: q }) })).text();
  const P = "PREFIX ukhpi: <http://landregistry.data.gov.uk/def/ukhpi/>";
  const monthCsv = await post(`${P} SELECT (MAX(?m) AS ?month) WHERE { ?x ukhpi:refRegion <http://landregistry.data.gov.uk/id/region/united-kingdom> ; ukhpi:refMonth ?m ; ukhpi:averagePrice ?p }`);
  const month = csvRows(monthCsv)[0]?.[0];
  if (!month || !/^\d{4}-\d{2}$/.test(month)) throw new Error("no HPI month");
  const t = await post(`${P} SELECT ?code ?price WHERE { ?r ukhpi:refRegion ?reg ; ukhpi:refMonth "${month}"^^<http://www.w3.org/2001/XMLSchema#gYearMonth> ; ukhpi:averagePrice ?price . ?reg <http://www.w3.org/2000/01/rdf-schema#seeAlso> ?code . FILTER(STRSTARTS(STR(?code), "http://statistics.data.gov.uk/")) }`);
  const map = new Map<string, number>();
  for (const r of csvRows(t)) { const code = (r[0] ?? "").split("/").pop() ?? ""; const v = Number(r[1]); if (isLaCode(code) && Number.isFinite(v)) map.set(code, v); }
  return { map, month };
}

/** District → county lookup (ONS Open Geography), so two-tier districts use their county's schools. */
async function fetchCounties() {
  const r = await (await get("https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/LAD23_CTY23_EN_LU/FeatureServer/0/query?where=1%3D1&outFields=LAD23CD,CTY23NM&returnGeometry=false&resultRecordCount=2000&f=json")).json() as { features?: { attributes: { LAD23CD: string; CTY23NM: string } }[] };
  return new Map((r.features ?? []).map((f) => [f.attributes.LAD23CD, f.attributes.CTY23NM]));
}

async function fetchSchools(db: Awaited<ReturnType<typeof admin>>) {
  const { data, error } = await db.rpc("school_quality_by_la");
  if (error) throw new Error(error.message);
  const map = new Map<string, number>();
  for (const r of (data ?? []) as { la: string; rated: number; good: number }[]) if (Number(r.rated) >= 5) map.set(normName(r.la), Math.round((Number(r.good) / Number(r.rated)) * 1000) / 10);
  const s = (await db.from("payload_cache").select("data").eq("id", "education-v1").maybeSingle()).data?.data as { ofsted?: { asAt?: string } } | undefined;
  return { map, asAt: s?.ofsted?.asAt ?? null };
}

export async function refreshPlaces(): Promise<PlacesPayload> {
  const db = await admin();
  const errors: string[] = [];
  const prev = await readPlaces();
  const safe = <T,>(name: string, p: Promise<T>) => p.catch((e: Error) => { errors.push(`${name}: ${e.message}`); return null; });
  const { loadCityCrime } = await import("./city-crime.server");
  const [wb, pay, pop, hpi, schools, crime] = await Promise.all([
    safe("wellbeing", fetchWellbeing()), safe("pay", fetchPay()), safe("population", fetchPopulation()),
    safe("house prices", fetchHpi()), safe("schools", fetchSchools(db)), safe("crime", loadCityCrime("uk")),
  ]);
  const counties = await safe("county lookup", fetchCounties());
  // Any source that failed keeps its last stored figures for every place.
  const prevBy = new Map((prev?.places ?? []).map((p) => [p.code, p]));
  // Community Safety Partnerships mostly match a council: join on code, else on the published name.
  const crimeMap = new Map<string, number>();
  for (const r of crime?.rows ?? []) { crimeMap.set(r.code, r.value); crimeMap.set(normName(r.name), r.value); }
  const codes = new Set<string>([...(wb?.rows.keys() ?? []), ...(pop?.names.keys() ?? []), ...prevBy.keys()].filter(isLaCode));
  const places: Place[] = [...codes].map((code) => {
    const old = prevBy.get(code);
    const name = wb?.rows.get(code)?.name ?? pop?.names.get(code) ?? pay?.map.get(code)?.name ?? old?.name ?? code;
    return {
      code, name, nation: nationOf(code),
      wellbeing: wb ? wb.rows.get(code)?.wb ?? null : old?.wellbeing ?? null,
      crimeRate: crime?.rows.length ? crimeMap.get(code) ?? crimeMap.get(normName(name)) ?? null : old?.crimeRate ?? null,
      housePrice: hpi ? hpi.map.get(code) ?? null : old?.housePrice ?? null,
      weeklyPay: pay ? pay.map.get(code)?.v ?? null : old?.weeklyPay ?? null,
      over65Share: pop ? pop.share.get(code) ?? null : old?.over65Share ?? null,
      ...schoolsFor(code, name, old),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
  function schoolsFor(code: string, name: string, old: Place | undefined): Pick<Place, "goodSchoolsShare" | "schoolsArea"> {
    if (nationOf(code) !== "England") return { goodSchoolsShare: null, schoolsArea: null };
    if (!schools) return { goodSchoolsShare: old?.goodSchoolsShare ?? null, schoolsArea: old?.schoolsArea ?? null };
    const own = schools.map.get(normName(name));
    if (own != null) return { goodSchoolsShare: own, schoolsArea: name };
    const county = counties?.get(code);
    const c = county ? schools.map.get(normName(county)) : undefined;
    return c != null ? { goodSchoolsShare: c, schoolsArea: county! } : { goodSchoolsShare: null, schoolsArea: null };
  }
  const ps = prev?.sources;
  const payload: PlacesPayload = {
    fetchedAt: new Date().toISOString(),
    places,
    sources: {
      wellbeing: wb ? { name: `ONS · Personal well-being estimates by local authority (Annual Population Survey), released ${wb.released ?? "—"}`, url: "https://www.ons.gov.uk/datasets/wellbeing-local-authority", period: `April ${wb.period.slice(0, 4)} to March 20${wb.period.slice(-2)}` } : ps?.wellbeing ?? { name: "ONS personal well-being", url: "https://www.ons.gov.uk/datasets/wellbeing-local-authority", period: null },
      crime: crime?.rows.length ? { name: crime.source, url: crime.sourceUrl, period: crime.period } : ps?.crime ?? { name: "ONS police recorded crime", url: "https://www.ons.gov.uk/peoplepopulationandcommunity/crimeandjustice", period: null },
      housePrice: hpi ? { name: "HM Land Registry / ONS · UK House Price Index, average price", url: "https://landregistry.data.gov.uk/app/ukhpi", period: hpi.month } : ps?.housePrice ?? { name: "UK House Price Index", url: "https://landregistry.data.gov.uk/app/ukhpi", period: null },
      pay: pay ? { name: "ONS · Annual Survey of Hours and Earnings (resident analysis), median full-time weekly pay", url: "https://www.nomisweb.co.uk/datasets/asher", period: pay.year } : ps?.pay ?? { name: "ONS ASHE", url: "https://www.nomisweb.co.uk/datasets/asher", period: null },
      population: pop ? { name: "ONS / NRS / NISRA · Mid-year population estimates", url: "https://www.nomisweb.co.uk/datasets/pestsyoala", period: `mid-${pop.year}` } : ps?.population ?? { name: "Mid-year population estimates", url: "https://www.nomisweb.co.uk/datasets/pestsyoala", period: null },
      schools: schools ? { name: "Ofsted · state-funded school inspections (graded \"Quality of education\")", url: "https://www.gov.uk/government/statistical-data-sets/monthly-management-information-ofsteds-school-inspections-outcomes", period: schools.asAt } : ps?.schools ?? { name: "Ofsted management information", url: "https://www.gov.uk/government/statistical-data-sets/monthly-management-information-ofsteds-school-inspections-outcomes", period: null },
    },
    errors,
  };
  if (places.length) await db.from("payload_cache").upsert({ id: PLACES_CACHE_ID, data: payload, updated_at: payload.fetchedAt });
  return payload;
}

export async function readPlaces(): Promise<PlacesPayload | null> {
  const db = await admin();
  const { data } = await db.from("payload_cache").select("data").eq("id", PLACES_CACHE_ID).maybeSingle();
  return (data?.data as PlacesPayload | undefined) ?? null;
}

/** Stored snapshot first; only a cold cache waits on the publishers. */
export async function loadPlaces(): Promise<PlacesPayload> {
  return (await readPlaces()) ?? refreshPlaces();
}
