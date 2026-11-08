import { useEffect, useState } from "react";
import { twoline2satrec, propagate, gstime, eciToGeodetic, degreesLat, degreesLong, type SatRec } from "satellite.js";
import type { Tle } from "@/lib/satellites";

const R = 6371;
type Sat = { id: string; lat: number; lng: number; alt: number; label: string; path: [number, number, number][] };

function at(rec: SatRec, d: Date) {
  const pv = propagate(rec, d);
  const p = pv && typeof pv.position === "object" ? pv.position : null;
  if (!p) return null;
  const g = eciToGeodetic(p, gstime(d));
  return { lat: degreesLat(g.latitude), lng: degreesLong(g.longitude), km: g.height };
}

/** Current satellite positions (every 5s) and the next 90 minutes of ground track, computed in the browser. */
export function useSatPositions(tles: Tle[] | null): Sat[] {
  const [sats, setSats] = useState<Sat[]>([]);
  useEffect(() => {
    if (!tles?.length) { setSats([]); return; }
    const recs = tles.map((t) => ({ t, rec: twoline2satrec(t.l1, t.l2) }));
    const run = () => {
      const now = new Date();
      setSats(recs.flatMap(({ t, rec }) => {
        const c = at(rec, now); if (!c) return [];
        const path: [number, number, number][] = [];
        for (let m = 0; m <= 90; m += 2) { const q = at(rec, new Date(now.getTime() + m * 60_000)); if (q) path.push([q.lat, q.lng, Math.min(q.km / R, 0.25)]); }
        return [{ id: `sat-${t.id}`, lat: c.lat, lng: c.lng, alt: Math.min(c.km / R, 0.25), label: `${t.name} — ${Math.round(c.km)} km up (calculated from CelesTrak orbit data)`, path }];
      }));
    };
    run();
    const i = setInterval(run, 5000);
    return () => clearInterval(i);
  }, [tles]);
  return sats;
}
