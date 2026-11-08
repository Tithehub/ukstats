import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { parseQuakes, type Quake } from "./quakes";
import { parseWx, WX_CITIES, type WxReading } from "./weather-globe";
import { parseTle, SATELLITES, type Tle } from "./satellites";

let quakeCache: { at: number; items: Quake[] } | null = null;
let tleCache: { at: number; items: Tle[] } | null = null;

export const getQuakes = createServerFn({ method: "POST" }).handler(async () => {
  if (quakeCache && Date.now() - quakeCache.at < 5 * 60_000) return quakeCache;
  try {
    const r = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson");
    if (!r.ok) throw new Error(String(r.status));
    quakeCache = { at: Date.now(), items: parseQuakes(await r.json()) };
  } catch (e) { console.error("USGS quakes failed", e); }
  return quakeCache; // last good copy, or null
});

export const getTles = createServerFn({ method: "POST" }).handler(async () => {
  if (tleCache && Date.now() - tleCache.at < 12 * 3600_000) return tleCache;
  const got = await Promise.all(SATELLITES.map(async (s) => {
    try {
      const r = await fetch(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${s.id}&FORMAT=tle`);
      return r.ok ? parseTle(await r.text(), s.id, s.name) : null;
    } catch { return null; }
  }));
  const items = got.filter((x): x is Tle => !!x);
  if (items.length) tleCache = { at: Date.now(), items };
  return tleCache;
});

let wxCache: { at: number; items: WxReading[] } | null = null;
export const getWeather = createServerFn({ method: "POST" }).handler(async () => {
  if (wxCache && Date.now() - wxCache.at < 30 * 60_000) return wxCache;
  try {
    const lat = WX_CITIES.map((c) => c[1]).join(","), lng = WX_CITIES.map((c) => c[2]).join(",");
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&timezone=GMT`);
    if (!r.ok) throw new Error(String(r.status));
    const items = parseWx(await r.json());
    if (items.length) wxCache = { at: Date.now(), items };
  } catch (e) { console.error("Open-Meteo failed", e); }
  return wxCache;
});
export const weatherQuery = (on: boolean) => queryOptions({ queryKey: ["globe-weather"], queryFn: () => getWeather(), enabled: on, staleTime: 25 * 60_000, refetchInterval: on ? 30 * 60_000 : false });

export const quakesQuery = (on: boolean) => queryOptions({ queryKey: ["quakes"], queryFn: () => getQuakes(), enabled: on, staleTime: 4 * 60_000, refetchInterval: on ? 5 * 60_000 : false });
export const tlesQuery = (on: boolean) => queryOptions({ queryKey: ["tles"], queryFn: () => getTles(), enabled: on, staleTime: 6 * 3600_000 });
