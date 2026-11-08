/** Well-known satellites tracked from CelesTrak's published orbit data (TLEs). */
export const SATELLITES = [
  { id: 25544, name: "ISS (International Space Station)" },
  { id: 48274, name: "Tiangong (Chinese space station)" },
  { id: 20580, name: "Hubble Space Telescope" },
  { id: 39084, name: "Landsat 8" },
  { id: 49260, name: "Landsat 9" },
  { id: 40697, name: "Sentinel-2A" },
  { id: 42063, name: "Sentinel-2B" },
  { id: 39634, name: "Sentinel-1A" },
  { id: 33591, name: "NOAA 19 (weather)" },
  { id: 43013, name: "NOAA 20 (weather)" },
] as const;
export const SAT_SOURCE = { name: "CelesTrak orbit data", url: "https://celestrak.org/" } as const;
export interface Tle { id: number; name: string; l1: string; l2: string }

/** Parse a 3-line TLE text block for one catalogue number. */
export function parseTle(text: string, id: number, name: string): Tle | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const l1 = lines.find((l) => l.startsWith("1 ")), l2 = lines.find((l) => l.startsWith("2 "));
  if (!l1 || !l2 || l1.length < 69 || l2.length < 69) return null;
  if (Number(l2.slice(2, 7)) !== id) return null;
  return { id, name, l1, l2 };
}
