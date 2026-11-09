import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { CALTRANS_DISTRICTS, parseCaltransCams, parseDriveBcCams, parseFintrafficCams, parseHongKongCams, parseIcelandCams, parseLithuaniaCams, parseNztaCams, parseOregonCams, parseTflCams, type PublicCam } from "./public-cams";

let cache: { at: number; items: PublicCam[]; failed: string[] } | null = null;

export const getPublicCams = createServerFn({ method: "POST" }).handler(async () => {
  if (cache && Date.now() - cache.at < 6 * 3600_000) return cache;
  const failed: string[] = [];
  const grab = async <T,>(label: string, url: string, parse: (j: unknown) => T[], asText = false): Promise<T[]> => {
    try {
      const r = await fetch(url, { headers: { "user-agent": "UKStats/1.0 (+https://ukstats.co.uk)", "accept-encoding": "gzip" }, signal: AbortSignal.timeout(20_000) });
      if (!r.ok) { await r.body?.cancel(); throw new Error(String(r.status)); }
      return parse(asText ? await r.text() : await r.json());
    } catch (e) { console.error("camera list failed", label, e); failed.push(label); return []; }
  };
  const lists = await Promise.all([
    grab("Transport for London", "https://api.tfl.gov.uk/Place/Type/JamCam", parseTflCams),
    ...CALTRANS_DISTRICTS.map((d) => { const dd = String(d).padStart(2, "0"); return grab(`Caltrans district ${d}`, `https://cwwp2.dot.ca.gov/data/d${d}/cctv/cctvStatusD${dd}.json`, (j) => parseCaltransCams(j, d)); }),
    grab("DriveBC", "https://www.drivebc.ca/api/webcams/", parseDriveBcCams),
    grab("Fintraffic", "https://tie.digitraffic.fi/api/weathercam/v1/stations", parseFintrafficCams),
    grab("Vegagerðin", "https://gagnaveita.vegagerdin.is/api/vefmyndavelar2014_1", parseIcelandCams),
    grab("Hong Kong Transport Department", "https://static.data.gov.hk/td/traffic-snapshot-images/code/Traffic_Camera_Locations_En.xml", parseHongKongCams, true),
    grab("NZ Transport Agency", "https://trafficnz.info/service/traffic/rest/4/cameras/all", parseNztaCams, true),
    grab("Oregon DOT", "https://tripcheck.com/Scripts/map/data/cctvinventory.js", parseOregonCams),
    grab("Eismoinfo", "https://eismoinfo.lt/eismoinfo-backend/camera-info-table", parseLithuaniaCams),
  ]);
  const items = lists.flat();
  if (items.length) cache = { at: Date.now(), items, failed };
  return cache ?? { at: Date.now(), items: [], failed };
});

export const publicCamsQuery = (on: boolean) => queryOptions({ queryKey: ["public-cams"], queryFn: () => getPublicCams(), enabled: on, staleTime: 3 * 3600_000 });
