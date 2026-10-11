import { createServerFn } from "@tanstack/react-start";
import { countryByCode, COUNTRIES, type CountryMetric, type CountryPayload } from "@/lib/countries";
import { ES_DEFS, parseByGeo, type GeoSeries, type JsonStat } from "@/lib/eurostat";

const BASE = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/";
const TTL = 30 * 60_000;
type DS = { at: number; data: Promise<{ geo: Record<string, GeoSeries>; updated: string | null }> };
const cache = new Map<string, DS>();

function fetchDataset(id: string) {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  const def = ES_DEFS.find((d) => d.id === id)!;
  const qs = new URLSearchParams({ ...def.params, lastTimePeriod: "12", lang: "EN" });
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
  const def = ES_DEFS.find((d) => d.id === defId)!;
  const sourceUrl = `https://ec.europa.eu/eurostat/databrowser/view/${def.dataset}/default/table`;
  const base: CountryMetric = { id: def.id, title: def.title, value: null, period: null, asOf: null, cadence: def.cadence, source: `Eurostat (${def.dataset})`, sourceUrl, spark: [], raw: null, note: def.note ?? null };
  try {
    const ds = await fetchDataset(defId);
    const pts = ds.geo[geo]?.points ?? [];
    const last = pts[pts.length - 1];
    if (!last) return { ...base, asOf: ds.updated, note: def.note ?? "Eurostat publishes no figure for this country in this series." };
    return { ...base, value: def.fmt(last.value), raw: last.value, period: last.time, asOf: ds.updated, spark: pts.map((p) => p.value) };
  } catch {
    return { ...base, note: "Eurostat feed unreachable just now — no figure shown rather than a guess." };
  }
}

export const getCountryStats = createServerFn({ method: "GET" })
  .inputValidator((d: { code: string }) => d)
  .handler(async ({ data }): Promise<CountryPayload | null> => {
    const country = countryByCode(data.code);
    if (!country) return null;
    const metrics = country.eurostat ? await Promise.all(ES_DEFS.map((d) => metricFor(d.id, country.eurostat!))) : [];
    return { country, metrics, fetchedAt: new Date().toISOString() };
  });

export const getComparison = createServerFn({ method: "GET" })
  .inputValidator((d: { metric: string }) => d)
  .handler(async ({ data }) => {
    const def = ES_DEFS.find((d) => d.id === data.metric) ?? ES_DEFS[0];
    const rows = await Promise.all(
      COUNTRIES.filter((c) => c.eurostat).map(async (c) => ({ code: c.code, name: c.name, m: await metricFor(def.id, c.eurostat!) })),
    );
    return { metric: def.id, title: def.title, rows: rows.map((r) => ({ code: r.code, name: r.name, value: r.m.value, raw: r.m.raw, period: r.m.period })), source: `Eurostat (${def.dataset})`, sourceUrl: `https://ec.europa.eu/eurostat/databrowser/view/${def.dataset}/default/table` };
  });
