import { feature } from "topojson-client";
import topo from "world-atlas/countries-110m.json";
import { countryKey } from "./unrest";
import { areaAt, buildAreas, dedupePlanes, parseAdsbLol, parseOpenSky, type Area, type FlightsPayload, type Plane } from "./flights";

const TTL = 60_000;
const ID = "flights-v1";
let mem: FlightsPayload | null = null;
let inflight: Promise<FlightsPayload> | null = null;
let areas: Area[] | null = null;

/** Fallback coverage: 250 nm circles over the busiest airspace (adsb.lol only answers by area). */
const TILES: [number, number][] = [
  [51.5, -0.5], [53.5, -6], [48.8, 2.5], [50.5, 8.5], [52.5, 13.5], [45.5, 9], [41.5, 12.5], [40.5, -3.5], [38.5, -9], [47.5, 19], [52, 21], [59.5, 18], [60, 25], [41, 29], [37.5, 23.5],
  [40.7, -74], [42, -87.9], [33.9, -118.4], [37.6, -122.4], [33.6, -84.4], [32.9, -97], [39.8, -104.7], [47.4, -122.3], [25.8, -80.3], [43.7, -79.6], [29.9, -95.3], [19.4, -99.1],
  [25.2, 55.3], [35.6, 139.8], [22.3, 114], [1.35, 104], [31.2, 121.5], [28.6, 77.1], [-33.9, 151.2], [-23.4, -46.5],
];

async function get(url: string, ms: number): Promise<unknown> {
  const r = await fetch(url, { signal: AbortSignal.timeout(ms), headers: { "User-Agent": "UKStats globe (ukstats.co.uk)" } });
  if (!r.ok) { await r.body?.cancel(); throw new Error(`${url} ${r.status}`); }
  return r.json();
}

async function collect(): Promise<FlightsPayload> {
  areas ??= buildAreas((feature(topo as any, (topo as any).objects.countries) as any).features, countryKey);
  let planes: Plane[] = [], source: FlightsPayload["source"] = null, partial = false;
  try {
    planes = parseOpenSky(await get("https://opensky-network.org/api/states/all", 15_000));
    if (planes.length) source = "OpenSky Network";
  } catch (e) { console.error("OpenSky", String(e)); }
  if (!planes.length) {
    const urls = [...TILES.map(([a, b]) => `https://api.adsb.lol/v2/lat/${a}/lon/${b}/dist/250`)];
    let i = 0; const got: Plane[] = [];
    await Promise.all(Array.from({ length: 6 }, async () => { while (i < urls.length) { const u = urls[i++]!; try { got.push(...parseAdsbLol(await get(u, 12_000))); } catch { /* skip this area */ } } }));
    planes = got; if (got.length) { source = "adsb.lol"; partial = true; }
  }
  // Emergency codes worldwide, whichever feed answered above.
  for (const c of ["7500", "7600", "7700"]) { try { planes.push(...parseAdsbLol(await get(`https://api.adsb.lol/v2/sqk/${c}`, 10_000))); } catch { /* none */ } }
  planes = dedupePlanes(planes);
  for (const p of planes) p[8] = areaAt(p[2], p[3], areas);
  return { planes, fetchedAt: new Date().toISOString(), source, partial, error: planes.length ? null : "Flight data unavailable" };
}

async function readStored(): Promise<FlightsPayload | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const read = (supabaseAdmin.from as (t: string) => any)("payload_cache").select("data").eq("id", ID).maybeSingle();
    const r = (await Promise.race([read, new Promise((ok) => setTimeout(() => ok(null), 2_000))])) as { data?: { data?: FlightsPayload } } | null;
    return r?.data?.data?.fetchedAt ? r.data.data : null;
  } catch { return null; }
}

function refresh(prev: FlightsPayload | null): Promise<FlightsPayload> {
  if (inflight) return inflight;
  inflight = collect().then(async (d) => {
    if (!d.planes.length && prev?.planes.length) return (mem = { ...prev, error: "Flight data unavailable this round" });
    mem = d;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await (supabaseAdmin.from as (t: string) => any)("payload_cache").upsert({ id: ID, data: d, updated_at: d.fetchedAt });
    } catch { /* keep in memory */ }
    return d;
  }).finally(() => { inflight = null; });
  return inflight;
}

/** Serves the last good positions; refreshes when older than a minute. */
export async function loadFlights(): Promise<FlightsPayload> {
  if (!mem) mem = await readStored();
  if (mem && Date.now() - Date.parse(mem.fetchedAt) < TTL) return mem;
  if (mem && Date.now() - Date.parse(mem.fetchedAt) < 10 * 60_000) { void refresh(mem).catch(() => {}); return mem; }
  return refresh(mem);
}
