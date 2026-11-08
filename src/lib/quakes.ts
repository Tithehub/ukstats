/** USGS earthquake feed (magnitude 2.5+, past day) — pure parser. */
export interface Quake { id: string; mag: number; place: string; time: string; lat: number; lng: number; depthKm: number; url: string; tsunami: boolean }
export const QUAKE_SOURCE = { name: "US Geological Survey", url: "https://earthquake.usgs.gov/earthquakes/map/" } as const;

export function parseQuakes(json: unknown): Quake[] {
  const feats = (json as { features?: unknown[] })?.features;
  if (!Array.isArray(feats)) return [];
  const out: Quake[] = [];
  for (const f of feats as { id?: string; properties?: Record<string, unknown>; geometry?: { coordinates?: number[] } }[]) {
    const p = f.properties ?? {}, c = f.geometry?.coordinates ?? [];
    const mag = Number(p["mag"]), t = Number(p["time"]), lng = Number(c[0]), lat = Number(c[1]);
    if (!f.id || !Number.isFinite(mag) || !Number.isFinite(t) || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    out.push({ id: f.id, mag, place: String(p["place"] ?? "Location not stated"), time: new Date(t).toISOString(), lat, lng, depthKm: Number(c[2]) || 0, url: String(p["url"] ?? QUAKE_SOURCE.url), tsunami: p["tsunami"] === 1 });
  }
  return out.sort((a, b) => b.mag - a.mag);
}
