import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { CALTRANS_DISTRICTS, parseCaltransCams, parseTflCams, type PublicCam } from "./public-cams";

let cache: { at: number; items: PublicCam[]; failed: string[] } | null = null;

export const getPublicCams = createServerFn({ method: "POST" }).handler(async () => {
  if (cache && Date.now() - cache.at < 6 * 3600_000) return cache;
  const failed: string[] = [];
  const grab = async <T,>(label: string, url: string, parse: (j: unknown) => T[]): Promise<T[]> => {
    try {
      const r = await fetch(url, { headers: { "user-agent": "UKStats/1.0 (+https://ukstats.co.uk)" } });
      if (!r.ok) { await r.body?.cancel(); throw new Error(String(r.status)); }
      return parse(await r.json());
    } catch (e) { console.error("camera list failed", label, e); failed.push(label); return []; }
  };
  const lists = await Promise.all([
    grab("Transport for London", "https://api.tfl.gov.uk/Place/Type/JamCam", parseTflCams),
    ...CALTRANS_DISTRICTS.map((d) => { const dd = String(d).padStart(2, "0"); return grab(`Caltrans district ${d}`, `https://cwwp2.dot.ca.gov/data/d${d}/cctv/cctvStatusD${dd}.json`, (j) => parseCaltransCams(j, d)); }),
  ]);
  const items = lists.flat();
  if (items.length) cache = { at: Date.now(), items, failed };
  return cache ?? { at: Date.now(), items: [], failed };
});

export const publicCamsQuery = (on: boolean) => queryOptions({ queryKey: ["public-cams"], queryFn: () => getPublicCams(), enabled: on, staleTime: 3 * 3600_000 });
