// Public-authority open-data road cameras for the globe. Scene only — never a source of figures.
// Only operators that publish camera lists as open data; never private, police or home CCTV.

export interface PublicCam {
  id: string; lat: number; lng: number; place: string;
  operator: CamOperator;
  image: string;
  /** Short MP4 loop (TfL) — not continuous live video. */
  loop?: string | undefined;
  /** Continuous live HLS video stream published by the operator (Caltrans). */
  live?: string | undefined;
  /** Minutes between picture updates, as stated by the operator. */
  everyMin: number;
}

export const CAM_SOURCES = {
  "Transport for London": { country: "united kingdom", region: "London", name: "TfL JamCams (open data)", url: "https://api.tfl.gov.uk/Place/Type/JamCam", licence: "Powered by TfL Open Data", licenceUrl: "https://tfl.gov.uk/corporate/terms-and-conditions/transport-data-service" },
  Caltrans: { country: "united states", region: "California", name: "Caltrans CCTV (open data)", url: "https://cwwp2.dot.ca.gov/documentation/cctv/cctv.htm", licence: "Caltrans public data", licenceUrl: "https://cwwp2.dot.ca.gov/" },
  DriveBC: { country: "canada", region: "British Columbia", name: "DriveBC webcams (BC Ministry of Transportation)", url: "https://www.drivebc.ca/", licence: "Province of British Columbia", licenceUrl: "https://www2.gov.bc.ca/gov/content/home/copyright" },
  Fintraffic: { country: "finland", region: "Finland", name: "Fintraffic weather cameras (Digitraffic)", url: "https://www.digitraffic.fi/en/road-traffic/", licence: "CC BY 4.0, Fintraffic / digitraffic.fi", licenceUrl: "https://www.digitraffic.fi/en/terms-of-service/" },
  "Icelandic Road Administration": { country: "iceland", region: "Iceland", name: "Vegagerðin road cameras (open data)", url: "https://www.vegagerdin.is/", licence: "Vegagerðin open data", licenceUrl: "https://gagnaveita.vegagerdin.is/" },
  "Hong Kong Transport Department": { country: "china", region: "Hong Kong", name: "Traffic snapshot images (DATA.GOV.HK)", url: "https://data.gov.hk/en-data/dataset/hk-td-tis_2-traffic-snapshot-images", licence: "DATA.GOV.HK terms", licenceUrl: "https://data.gov.hk/en/terms-and-conditions" },
  "NZ Transport Agency": { country: "new zealand", region: "New Zealand", name: "NZTA traffic cameras (trafficnz.info)", url: "https://trafficnz.info/", licence: "CC BY 4.0, NZ Transport Agency Waka Kotahi", licenceUrl: "https://www.nzta.govt.nz/about-us/about-this-site/copyright/" },
  "Oregon DOT": { country: "united states", region: "Oregon", name: "ODOT TripCheck road cameras", url: "https://tripcheck.com/", licence: "Oregon Department of Transportation, TripCheck", licenceUrl: "https://tripcheck.com/Pages/Terms-of-Use" },
  "Lithuanian Road Administration": { country: "lithuania", region: "Lithuania", name: "Eismoinfo road cameras", url: "https://eismoinfo.lt/", licence: "Lietuvos automobilių kelių direkcija", licenceUrl: "https://eismoinfo.lt/" },
} as const;
export type CamOperator = keyof typeof CAM_SOURCES;
/** Country/region buttons for the camera list, one per source. */
export const CAM_REGIONS = Object.values(CAM_SOURCES).map((s) => ({ country: s.country, region: s.region }));

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
    const c = row.cctv as { index?: string; inService?: string; location?: { locationName?: string; nearbyPlace?: string; latitude?: string; longitude?: string }; imageData?: { streamingVideoURL?: string; static?: { currentImageURL?: string; currentImageUpdateFrequency?: string } } } | undefined;
    if (!c || c.inService !== "true") continue;
    if (!c.location?.latitude || !c.location?.longitude) continue;
    const lat = Number(c.location.latitude), lng = Number(c.location.longitude);
    const image = httpsOnly(c.imageData?.static?.currentImageURL);
    if (!image || !okCoord(lat, lng)) continue;
    const every = Number(c.imageData?.static?.currentImageUpdateFrequency);
    out.push({ id: `ct${district}-${c.index}`, lat, lng, place: `${c.location?.locationName ?? "Highway camera"}${c.location?.nearbyPlace ? `, ${c.location.nearbyPlace}` : ""}, California`, operator: "Caltrans", image, live: httpsOnly(c.imageData?.streamingVideoURL)?.endsWith(".m3u8") ? c.imageData!.streamingVideoURL : undefined, everyMin: Number.isFinite(every) && every > 0 ? every : 5 });
  }
  return out;
}

/** Cache-buster rounded to the operator's update window so viewers share one copy. */
export const camImageSrc = (c: PublicCam, now: number) => `${c.image}${c.image.includes("?") ? "&" : "?"}t=${Math.floor(now / (c.everyMin * 60_000))}`;


export type CamKind = "live" | "loop" | "still";
export const camKind = (c: PublicCam): CamKind => (c.live ? "live" : c.loop ? "loop" : "still");
/** Plain label for what the viewer is actually showing — a loop is never called live. */
export const camKindLabel = (c: PublicCam): string => {
  const k = camKind(c);
  if (k === "live") return "Live video";
  if (k === "loop") return `Short loop, updated every ${c.everyMin} min — not live`;
  return `Still picture, updated every ${c.everyMin} min`;
};
const byLiveThenPlace = (a: PublicCam, b: PublicCam) => Number(!!b.live) - Number(!!a.live) || a.place.localeCompare(b.place);

/** Cameras in a country (by operator): live video first, then by place name. */
export function camsForCountry(cams: PublicCam[], country: string): PublicCam[] {
  return cams.filter((c) => CAM_SOURCES[c.operator].country === country).sort(byLiveThenPlace);
}

/** Previous/next camera from the same operator in place-name order (wraps round). */
export function stepCam(cam: PublicCam, cams: PublicCam[], dir: 1 | -1): PublicCam | null {
  const list = cams.filter((c) => c.operator === cam.operator).sort((a, b) => a.place.localeCompare(b.place));
  if (list.length < 2) return null;
  const i = list.findIndex((c) => c.id === cam.id);
  return list[(i + dir + list.length) % list.length] ?? null;
}

const unxml = (t: string) => t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").trim();
const tag = (block: string, name: string) => { const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`)); return m ? unxml(m[1]!) : undefined; };
const blocks = (xml: string, name: string) => xml.match(new RegExp(`<${name}>[\\s\\S]*?</${name}>`, "g")) ?? [];

export function parseDriveBcCams(json: unknown): PublicCam[] {
  if (!Array.isArray(json)) return [];
  const out: PublicCam[] = [];
  for (const c of json as { id?: number; name?: string; region_name?: string; marked_stale?: boolean; is_on?: boolean; links?: { imageDisplay?: string }; location?: { coordinates?: [number, number] } }[]) {
    const [lng, lat] = c.location?.coordinates ?? [NaN, NaN];
    const path = c.links?.imageDisplay?.split("?")[0];
    if (!c.id || !path?.startsWith("/images/") || c.marked_stale || c.is_on === false || !okCoord(lat, lng)) continue;
    out.push({ id: `bc-${c.id}`, lat, lng, place: `${c.name ?? "Highway camera"}${c.region_name ? `, ${c.region_name}` : ""}, British Columbia`, operator: "DriveBC", image: `https://www.drivebc.ca${path}`, everyMin: 10 });
  }
  return out;
}

export function parseFintrafficCams(json: unknown): PublicCam[] {
  const f = (json as { features?: unknown[] })?.features;
  if (!Array.isArray(f)) return [];
  const out: PublicCam[] = [];
  for (const x of f as { id?: string; geometry?: { coordinates?: number[] }; properties?: { name?: string; collectionStatus?: string; presets?: { id?: string; inCollection?: boolean }[] } }[]) {
    const [lng, lat] = x.geometry?.coordinates ?? [];
    const preset = x.properties?.presets?.find((p) => p.inCollection && p.id);
    if (x.properties?.collectionStatus !== "GATHERING" || !preset?.id || !okCoord(Number(lat), Number(lng))) continue;
    const name = (x.properties?.name ?? "Road camera").replace(/^[a-z]+\d+_/i, "").replace(/_/g, " ");
    out.push({ id: `fi-${preset.id}`, lat: Number(lat), lng: Number(lng), place: `${name}, Finland`, operator: "Fintraffic", image: `https://weathercam.digitraffic.fi/${preset.id}.jpg`, everyMin: 10 });
  }
  return out;
}

export function parseIcelandCams(json: unknown): PublicCam[] {
  if (!Array.isArray(json)) return [];
  const out: PublicCam[] = []; const seen = new Set<string>();
  for (const c of json as { Myndavel?: string; Skyring?: string; Slod?: string; Breidd?: number; Lengd?: number }[]) {
    const image = httpsOnly(c.Slod);
    if (!image || seen.has(image) || !okCoord(Number(c.Breidd), Number(c.Lengd))) continue;
    seen.add(image);
    out.push({ id: `is-${image.split("/").pop()}`, lat: Number(c.Breidd), lng: Number(c.Lengd), place: `${c.Skyring || c.Myndavel || "Road camera"}, Iceland`, operator: "Icelandic Road Administration", image, everyMin: 10 });
  }
  return out;
}

export function parseHongKongCams(xml: unknown): PublicCam[] {
  if (typeof xml !== "string") return [];
  const out: PublicCam[] = [];
  for (const b of blocks(xml, "image")) {
    const key = tag(b, "key"), image = httpsOnly(tag(b, "url")), lat = Number(tag(b, "latitude")), lng = Number(tag(b, "longitude"));
    if (!key || !image || !okCoord(lat, lng)) continue;
    out.push({ id: `hk-${key}`, lat, lng, place: `${(tag(b, "description") ?? "Road camera").replace(/\s*\[[^\]]*\]$/, "")}, Hong Kong`, operator: "Hong Kong Transport Department", image, everyMin: 2 });
  }
  return out;
}

export function parseNztaCams(xml: unknown): PublicCam[] {
  if (typeof xml !== "string") return [];
  const out: PublicCam[] = [];
  for (const b of blocks(xml, "camera")) {
    const id = tag(b.replace(/<(journey|journeyLeg|region|way)>[\s\S]*?<\/\1>/g, ""), "id");
    const img = tag(b, "imageUrl"), flat = b.replace(/<(journey|journeyLeg)>[\s\S]*?<\/\1>/g, "");
    const lat = Number(tag(flat, "latitude")), lng = Number(tag(flat, "longitude"));
    if (!id || !img?.startsWith("/camera/") || tag(b, "offline") === "true" || tag(b, "underMaintenance") === "true" || !okCoord(lat, lng)) continue;
    const region = tag(b.match(/<region>[\s\S]*?<\/region>/)?.[0] ?? "", "name");
    out.push({ id: `nz-${id}`, lat, lng, place: `${tag(b, "description") || tag(flat, "name") || "Highway camera"}${region ? `, ${region}` : ""}, New Zealand`, operator: "NZ Transport Agency", image: `https://trafficnz.info${img}`, everyMin: 5 });
  }
  return out;
}

/** LKS94 (EPSG:3346, Transverse Mercator on GRS80) to WGS84 latitude/longitude. */
export function lks94ToLatLng(e: number, n: number): [number, number] {
  const a = 6378137, f = 1 / 298.257222101, k0 = 0.9998, lon0 = (24 * Math.PI) / 180, e2 = f * (2 - f), ep2 = e2 / (1 - e2);
  const M = n / k0, mu = M / (a * (1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const p1 = mu + ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) + ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) + ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) + ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);
  const C1 = ep2 * Math.cos(p1) ** 2, T1 = Math.tan(p1) ** 2, N1 = a / Math.sqrt(1 - e2 * Math.sin(p1) ** 2), R1 = (a * (1 - e2)) / (1 - e2 * Math.sin(p1) ** 2) ** 1.5, D = (e - 500000) / (N1 * k0);
  const lat = p1 - ((N1 * Math.tan(p1)) / R1) * (D ** 2 / 2 - ((5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * ep2) * D ** 4) / 24 + ((61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * ep2 - 3 * C1 ** 2) * D ** 6) / 720);
  const lng = lon0 + (D - ((1 + 2 * T1 + C1) * D ** 3) / 6 + ((5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * ep2 + 24 * T1 ** 2) * D ** 5) / 120) / Math.cos(p1);
  return [(lat * 180) / Math.PI, (lng * 180) / Math.PI];
}

export function parseLithuaniaCams(json: unknown): PublicCam[] {
  if (!Array.isArray(json)) return [];
  const out: PublicCam[] = [];
  for (const c of json as { id?: number; name?: string; roadName?: string; image?: string; x?: number; y?: number }[]) {
    const image = httpsOnly(c.image);
    if (!c.id || !image || !Number.isFinite(c.x) || !Number.isFinite(c.y)) continue;
    const [lat, lng] = lks94ToLatLng(Number(c.x), Number(c.y));
    if (!okCoord(lat, lng)) continue;
    out.push({ id: `lt-${c.id}`, lat, lng, place: `${c.name ?? "Road camera"}${c.roadName ? ` (${c.roadName})` : ""}, Lithuania`, operator: "Lithuanian Road Administration", image, everyMin: 10 });
  }
  return out;
}

/** Oregon DOT TripCheck camera inventory (Esri JSON, lat/lng given in attributes). Stills refreshed by ODOT. */
export function parseOregonCams(json: unknown): PublicCam[] {
  const f = (json as { features?: unknown[] })?.features;
  if (!Array.isArray(f)) return [];
  const out: PublicCam[] = []; const seen = new Set<string>();
  for (const x of f as { attributes?: { cameraId?: number; filename?: string; latitude?: number; longitude?: number; title?: string } }[]) {
    const a = x.attributes; const file = a?.filename;
    if (!a || !file || !/^[\w.-]+\.jpe?g$/i.test(file) || seen.has(file) || !okCoord(Number(a.latitude), Number(a.longitude))) continue;
    seen.add(file);
    out.push({ id: `or-${file.replace(/\.jpe?g$/i, "")}`, lat: Number(a.latitude), lng: Number(a.longitude), place: `${(a.title ?? "Road camera").trim()}, Oregon`, operator: "Oregon DOT", image: `https://tripcheck.com/RoadCams/cams/${file}`, everyMin: 5 });
  }
  return out;
}
