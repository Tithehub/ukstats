/** Pure orthographic projection helpers for the no-WebGL canvas globe. Degrees in, screen offsets (y down) out. */
const D = Math.PI / 180;

export interface View { lng: number; lat: number; r: number }

/** Project lng/lat onto a sphere of radius r facing (view.lng, view.lat). z > 0 means on the visible side. */
export function project(lng: number, lat: number, v: View): { x: number; y: number; z: number } {
  const l = (lng - v.lng) * D, p = lat * D, p0 = v.lat * D;
  const cp = Math.cos(p);
  return {
    x: v.r * cp * Math.sin(l),
    y: -v.r * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * cp * Math.cos(l)),
    z: Math.sin(p0) * Math.sin(p) + Math.cos(p0) * cp * Math.cos(l),
  };
}

/** Screen offset back to lng/lat, or null when off the disc. */
export function invert(x: number, y: number, v: View): { lng: number; lat: number } | null {
  const rho = Math.hypot(x, y);
  if (rho > v.r) return null;
  if (rho < 1e-9) return { lng: v.lng, lat: v.lat };
  const c = Math.asin(rho / v.r), Y = -y, p0 = v.lat * D;
  const lat = Math.asin(Math.cos(c) * Math.sin(p0) + (Y * Math.sin(c) * Math.cos(p0)) / rho) / D;
  let lng = v.lng + Math.atan2(x * Math.sin(c), rho * Math.cos(c) * Math.cos(p0) - Y * Math.sin(c) * Math.sin(p0)) / D;
  lng = ((lng + 540) % 360) - 180;
  return { lng, lat };
}

/** Ray-casting point-in-ring test in lng/lat space. */
export function inRing(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!, [xj, yj] = ring[j]!;
    if ((yi! > lat) !== (yj! > lat) && lng < ((xj! - xi!) * (lat - yi!)) / (yj! - yi!) + xi!) inside = !inside;
  }
  return inside;
}

/** Points along the great circle between two places (for migration arrows). */
export function greatCircle(a: { lat: number; lng: number }, b: { lat: number; lng: number }, n = 32): { lat: number; lng: number }[] {
  const v = (p: { lat: number; lng: number }) => [Math.cos(p.lat * D) * Math.cos(p.lng * D), Math.cos(p.lat * D) * Math.sin(p.lng * D), Math.sin(p.lat * D)];
  const A = v(a), B = v(b);
  const w = Math.acos(Math.min(1, Math.max(-1, A[0]! * B[0]! + A[1]! * B[1]! + A[2]! * B[2]!)));
  if (w < 1e-6) return [a, b];
  const out: { lat: number; lng: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, s1 = Math.sin((1 - t) * w) / Math.sin(w), s2 = Math.sin(t * w) / Math.sin(w);
    const x = s1 * A[0]! + s2 * B[0]!, y = s1 * A[1]! + s2 * B[1]!, z = s1 * A[2]! + s2 * B[2]!;
    out.push({ lat: Math.atan2(z, Math.hypot(x, y)) / D, lng: Math.atan2(y, x) / D });
  }
  return out;
}

/** Subsolar point for a UTC time (same formula as the 3D globe). */
export function subsolar(d: Date): { lat: number; lng: number } {
  const day = (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5;
  const g = (2 * Math.PI / 365) * (day - 1 + (d.getUTCHours() - 12) / 24);
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const mins = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
  const lng = ((-((mins + eqt) / 4 - 180)) + 540) % 360 - 180;
  return { lat: (decl * 180) / Math.PI, lng };
}
