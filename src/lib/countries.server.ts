import { countryByCode, COUNTRIES, type CountryMetric, type CountryPayload } from "./countries";
import { ES_DEFS, parseByGeo, type GeoSeries, type JsonStat } from "./eurostat";
import { coverageGaps, metricCategory } from "./country-detail";
import { nationalMetrics } from "./national.server";

const BASE = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/";
const TTL = 30 * 60_000;
type DS = { at: number; data: Promise<{ geo: Record<string, GeoSeries>; updated: string | null }> };
const cache = new Map<string, DS>();

function fetchDataset(id: string) {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  const def = ES_DEFS.find((d) => d.id === id);
  if (!def) throw new Error("Unknown official series");
  const qs = new URLSearchParams({ ...def.params, lastTimePeriod: "24", lang: "EN" });
  const data = (async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20_000);
    try {
      const res = await fetch(`${BASE}${def.dataset}?${qs}`, { signal: ctrl.signal, headers: { "user-agent": "ukstats-register/1.0" } });
      if (!res.ok) throw new Error(`Eurostat ${res.status}`);
      const js = (await res.json()) as JsonStat;
      return { geo: parseByGeo(js), updated: js.updated ?? null };
    } finally {
      clearTimeout(t);
    }
  })();
  data.catch(() => cache.delete(id));
  cache.set(id, { at: Date.now(), data });
  return data;
}

async function metricFor(defId: string, geo: string): Promise<CountryMetric> {
  const def = ES_DEFS.find((d) => d.id === defId);
  if (!def) throw new Error("Unknown official series");
  const sourceUrl = `https://ec.europa.eu/eurostat/databrowser/view/${def.dataset}/default/table`;
  const base: CountryMetric = { id: def.id, title: def.title, value: null, period: null, asOf: null, cadence: def.cadence, source: `Eurostat (${def.dataset})`, sourceUrl, spark: [], raw: null, note: def.note ?? null, category: def.category, status: "unavailable", history: [], calendarUrl: "https://ec.europa.eu/eurostat/web/main/news/release-calendar" };
  try {
    const ds = await fetchDataset(defId);
    const pts = ds.geo[geo]?.points ?? [];
    const last = pts[pts.length - 1];
    if (!last) return { ...base, asOf: ds.updated, status: "no-feed", note: def.note ?? "Eurostat publishes no figure for this country in this series." };
    return { ...base, value: def.fmt(last.value), raw: last.value, period: last.time, asOf: ds.updated, spark: pts.map((p) => p.value), status: "ok", history: pts.map(p => ({ ...p, formatted: def.fmt(p.value) })) };
  } catch {
    return { ...base, note: "Eurostat feed unreachable just now — no figure shown rather than a guess." };
  }
}

export async function loadCountryStats(code: string): Promise<CountryPayload | null> {
  const country = countryByCode(code);
  if (!country) return null;
  const geo = country.eurostat;
  const [es, nat] = await Promise.all([geo ? Promise.all(ES_DEFS.map(d => metricFor(d.id, geo))) : Promise.resolve([]), nationalMetrics(country.code)]);
  const known = [...nat.filter(m => m.value !== null), ...es, ...nat.filter(m => m.value === null)].map(m => ({ ...m, category: metricCategory(m) }));
  return { country, metrics: [...known, ...coverageGaps(country, known)], fetchedAt: new Date().toISOString() };
}
export async function loadCountryHistory(code: string, id: string): Promise<CountryMetric | null> {
  const country = countryByCode(code);
  if (!country) return null;
  const def = ES_DEFS.find(d => d.id === id);
  if (def && country.eurostat) {
    const base = await metricFor(id, country.eurostat);
    try {
      const qs = new URLSearchParams({ ...def.params, geo: country.eurostat, lang: 'EN' });
      const res = await fetch(`${BASE}${def.dataset}?${qs}`, { signal: AbortSignal.timeout(25000) });
      if (!res.ok) return { ...base, history: [], note: 'Historical feed unavailable; the latest figure remains independently sourced.' };
      const js = await res.json() as JsonStat;
      const pts = parseByGeo(js)[country.eurostat]?.points ?? [];
      return { ...base, history: pts.map(p => ({ ...p, formatted: def.fmt(p.value) })) };
    } catch { return { ...base, history: [], note: 'Historical feed unavailable; no observations invented.' }; }
  }
  return (await loadCountryStats(code))?.metrics.find(m => m.id === id) ?? null;
}
export async function loadComparison(id: string) {
  const def = ES_DEFS.find(d => d.id === id) ?? ES_DEFS[0];
  if (!def) throw new Error('No official comparison series');
  const rows = await Promise.all(COUNTRIES.filter(c => c.eurostat).map(async c => ({ code: c.code, name: c.name, m: await metricFor(def.id, c.eurostat ?? '') })));
  return { metric: def.id, title: def.title, rows: rows.map(r => ({ code: r.code, name: r.name, value: r.m.value, raw: r.m.raw, period: r.m.period })), source: `Eurostat (${def.dataset})`, sourceUrl: `https://ec.europa.eu/eurostat/databrowser/view/${def.dataset}/default/table` };
}
