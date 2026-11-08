// Public-authority open-data road cameras for the globe. Scene only — never a source of figures.
// Only operators that publish camera lists as open data; never private, police or home CCTV.

export interface PublicCam {
  id: string; lat: number; lng: number; place: string;
  operator: "Transport for London" | "Caltrans";
  image: string;
  /** Short MP4 loop (TfL) — not continuous live video. */
  loop?: string | undefined;
  /** Minutes between picture updates, as stated by the operator. */
  everyMin: number;
}

export const CAM_SOURCES = {
  "Transport for London": { name: "TfL JamCams (open data)", url: "https://api.tfl.gov.uk/Place/Type/JamCam", licence: "Powered by TfL Open Data", licenceUrl: "https://tfl.gov.uk/corporate/terms-and-conditions/transport-data-service" },
  Caltrans: { name: "Caltrans CCTV (open data)", url: "https://cwwp2.dot.ca.gov/documentation/cctv/cctv.htm", licence: "Caltrans public data", licenceUrl: "https://cwwp2.dot.ca.gov/" },
} as const;

export const CALTRANS_DISTRICTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const okCoord = (lat: number, lng: number) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0);
const httpsOnly = (u: unknown) => (typeof u === "string" && u.startsWith("https://") ? u : null);

export function parseTflCams(json: unknown): PublicCam[] {
  if (!Array.isArray(json)) return [];
  const out: PublicCam[] = [];
  for (const x of json as { id?: string; commonName?: string; lat?: number; lon?: number; additionalProperties?: { key: string; value: string }[] }[]) {
    const p = new Map((x.additionalProperties ?? []).map((a) => [a.key, a.value]));
    const image = httpsOnly(p.get("imageUrl"));
    if (!x.id || !image || p.get("available") === "false" || !okCoord(Number(x.lat), Number(x.lon))) continue;
    out.push({ id: `tfl-${x.id}`, lat: Number(x.lat), lng: Number(x.lon), place: `${x.commonName ?? "Road camera"}, London`, operator: "Transport for London", image, loop: httpsOnly(p.get("videoUrl")) ?? undefined, everyMin: 5 });
  }
  return out;
}

export function parseCaltransCams(json: unknown, district: number): PublicCam[] {
  const data = (json as { data?: { cctv?: Record<string, unknown> }[] })?.data;
  if (!Array.isArray(data)) return [];
  const out: PublicCam[] = [];
  for (const row of data) {
    const c = row.cctv as { index?: string; inService?: string; location?: { locationName?: string; nearbyPlace?: string; latitude?: string; longitude?: string }; imageData?: { static?: { currentImageURL?: string; currentImageUpdateFrequency?: string } } } | undefined;
    if (!c || c.inService !== "true") continue;
    const lat = Number(c.location?.latitude), lng = Number(c.location?.longitude);
    const image = httpsOnly(c.imageData?.static?.currentImageURL);
    if (!image || !okCoord(lat, lng)) continue;
    const every = Number(c.imageData?.static?.currentImageUpdateFrequency);
    out.push({ id: `ct${district}-${c.index}`, lat, lng, place: `${c.location?.locationName ?? "Highway camera"}${c.location?.nearbyPlace ? `, ${c.location.nearbyPlace}` : ""}, California`, operator: "Caltrans", image, everyMin: Number.isFinite(every) && every > 0 ? every : 5 });
  }
  return out;
}

/** Cache-buster rounded to the operator's update window so viewers share one copy. */
export const camImageSrc = (c: PublicCam, now: number) => `${c.image}?t=${Math.floor(now / (c.everyMin * 60_000))}`;
