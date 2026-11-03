import type { FcdoAlert } from "./unrest";

/** One aircraft position: [hex, callsign, lat, lng, altitudeFt, groundSpeedKt, trackDeg, squawk, countryKey under the plane, registration or registered country, position time (unix s)]. */
export type Plane = [string, string, number, number, number | null, number | null, number | null, string | null, string | null, string, number];

export interface FlightsPayload {
  planes: Plane[];
  fetchedAt: string;
  source: "OpenSky Network" | "adsb.lol" | null;
  /** True when the plane count covers only busy regions (fallback feed). */
  partial: boolean;
  error: string | null;
}

export type FlightStatus = "green" | "amber" | "red";

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** OpenSky /states/all → airborne planes (metres and m/s converted to feet and knots). */
export function parseOpenSky(json: unknown): Plane[] {
  const states = (json as { states?: unknown[][] } | null)?.states;
  if (!Array.isArray(states)) return [];
  const out: Plane[] = [];
  for (const s of states) {
    const lng = num(s[5]), lat = num(s[6]);
    if (lat === null || lng === null || s[8] === true) continue;
    const alt = num(s[7]) ?? num(s[13]), v = num(s[9]);
    out.push([String(s[0]), String(s[1] ?? "").trim(), r3(lat), r3(lng), alt === null ? null : Math.round(alt * 3.28084), v === null ? null : Math.round(v * 1.94384), num(s[10]), typeof s[14] === "string" ? s[14] : null, null, String(s[2] ?? ""), num(s[3]) ?? num(s[4]) ?? 0]);
  }
  return out;
}

/** adsb.lol v2 response → airborne planes. */
export function parseAdsbLol(json: unknown): Plane[] {
  const j = json as { ac?: Record<string, unknown>[]; now?: number } | null;
  if (!Array.isArray(j?.ac)) return [];
  const now = Math.round((j!.now ?? 0) / 1000);
  const out: Plane[] = [];
  for (const a of j!.ac) {
    const lat = num(a["lat"]), lng = num(a["lon"]);
    if (lat === null || lng === null || a["alt_baro"] === "ground") continue;
    const seen = num(a["seen_pos"]) ?? 0;
    out.push([String(a["hex"]), String(a["flight"] ?? "").trim(), r3(lat), r3(lng), num(a["alt_baro"]), num(a["gs"]) === null ? null : Math.round(a["gs"] as number), num(a["track"]), typeof a["squawk"] === "string" ? a["squawk"] : null, null, String(a["r"] ?? ""), Math.round(now - seen)]);
  }
  return out;
}

/** Keeps the newest position per aircraft. */
export function dedupePlanes(list: Plane[]): Plane[] {
  const m = new Map<string, Plane>();
  for (const p of list) { const o = m.get(p[0]); if (!o || p[10] > o[10]) m.set(p[0], p); }
  return [...m.values()];
}

/** Each government's own advice for a country, as used for flight colours. */
export interface AreaAdvice { us?: number; uk?: FcdoAlert }

export const SQUAWK_MEANING: Record<string, string> = { "7500": "hijack code 7500", "7600": "radio failure code 7600", "7700": "general emergency code 7700" };

/** Emergency codes override; otherwise colour by the advice for the country under the plane. */
export function flightStatus(squawk: string | null, advice: AreaAdvice | undefined): { status: FlightStatus; reason: string } {
  if (squawk === "7700" || squawk === "7500") return { status: "red", reason: `Aircraft is broadcasting ${SQUAWK_MEANING[squawk]}` };
  if (squawk === "7600") return { status: "amber", reason: `Aircraft is broadcasting ${SQUAWK_MEANING[squawk]}` };
  if (advice?.us === 4) return { status: "red", reason: "Over a country with US State Dept Level 4: Do not travel" };
  if (advice?.uk === "all") return { status: "red", reason: "Over a country where the UK FCDO advises against all travel" };
  if (advice?.us === 3) return { status: "amber", reason: "Over a country with US State Dept Level 3: Reconsider travel" };
  if (advice?.uk === "all-but-essential") return { status: "amber", reason: "Over a country where the UK FCDO advises against all but essential travel" };
  if (advice?.uk === "parts-all" || advice?.uk === "parts-essential") return { status: "amber", reason: "Over a country where the UK FCDO advises against travel to parts" };
  return { status: "green", reason: "No emergency code and no high-level travel warning for the country below" };
}

/** Point a set distance (km) ahead along a heading — a direction line, not a route. */
export function projectAhead(lat: number, lng: number, trackDeg: number, km: number): [number, number] {
  const R = 6371, d = km / R, b = (trackDeg * Math.PI) / 180, p1 = (lat * Math.PI) / 180, l1 = (lng * Math.PI) / 180;
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(b));
  const l2 = l1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
  return [(p2 * 180) / Math.PI, ((((l2 * 180) / Math.PI) + 540) % 360) - 180];
}

type Ring = number[][];
export interface Area { key: string; box: [number, number, number, number]; polys: Ring[][] }

function inRing(x: number, y: number, ring: Ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]![0]!, yi = ring[i]![1]!, xj = ring[j]![0]!, yj = ring[j]![1]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Country outlines with bounding boxes, for fast lookups. */
export function buildAreas(features: { properties: { name: string }; geometry: { type: string; coordinates: any } }[], keyOf: (n: string) => string): Area[] {
  return features.flatMap((f) => {
    const polys: Ring[][] = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.type === "MultiPolygon" ? f.geometry.coordinates : [];
    if (!polys.length) return [];
    let a = 180, b = 90, c = -180, d = -90;
    for (const p of polys) for (const [x, y] of p[0]!) { a = Math.min(a, x!); b = Math.min(b, y!); c = Math.max(c, x!); d = Math.max(d, y!); }
    return [{ key: keyOf(f.properties.name), box: [a, b, c, d] as [number, number, number, number], polys }];
  });
}

/** Country under a point, or null over sea. */
export function areaAt(lat: number, lng: number, areas: Area[]): string | null {
  for (const a of areas) {
    if (lng < a.box[0] || lng > a.box[2] || lat < a.box[1] || lat > a.box[3]) continue;
    for (const p of a.polys) if (inRing(lng, lat, p[0]!) && !p.slice(1).some((h) => inRing(lng, lat, h))) return a.key;
  }
  return null;
}
