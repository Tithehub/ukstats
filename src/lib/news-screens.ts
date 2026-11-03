/** Pure layout helpers for floating news screens over the globe. */
export type NewsScreen = { id: string; country: string; x: number; y: number; w: number; h: number; min: boolean; z: number };

export const MAX_SCREENS = 6;
export const MIN_W = 280;
export const MIN_H = 220;
export const DEFAULT_W = 340;
export const DEFAULT_H = 360;
export const STORAGE_KEY = "ukstats-news-screens";

/** Keep a screen at least min size, no larger than the area, and fully inside it. */
export function clampScreen<T extends Pick<NewsScreen, "x" | "y" | "w" | "h">>(s: T, areaW: number, areaH: number): T {
  const w = Math.max(MIN_W, Math.min(s.w, Math.max(MIN_W, areaW)));
  const h = Math.max(MIN_H, Math.min(s.h, Math.max(MIN_H, areaH)));
  const x = Math.min(Math.max(0, s.x), Math.max(0, areaW - w));
  const y = Math.min(Math.max(0, s.y), Math.max(0, areaH - h));
  return { ...s, x, y, w, h };
}

export function canAdd(list: NewsScreen[]) { return list.length < MAX_SCREENS; }

/** New screen, cascaded from the top-left so it never lands exactly on another. */
export function newScreen(list: NewsScreen[], country: string, areaW: number, areaH: number, id: string): NewsScreen {
  const n = list.length;
  const z = list.reduce((m, s) => Math.max(m, s.z), 0) + 1;
  return clampScreen({ id, country, x: 16 + n * 28, y: 56 + n * 28, w: DEFAULT_W, h: DEFAULT_H, min: false, z }, areaW, areaH);
}

/** Arrange screens in a neat grid that fits the area. */
export function tidy(list: NewsScreen[], areaW: number, areaH: number): NewsScreen[] {
  if (!list.length) return list;
  const gap = 8;
  const cols = Math.max(1, Math.min(list.length, Math.floor((areaW - gap) / (MIN_W + gap))));
  const rows = Math.ceil(list.length / cols);
  const w = Math.max(MIN_W, Math.floor((areaW - gap * (cols + 1)) / cols));
  const h = Math.max(MIN_H, Math.floor((areaH - gap * (rows + 1)) / rows));
  return list.map((s, i) => clampScreen({ ...s, min: false, x: gap + (i % cols) * (w + gap), y: gap + Math.floor(i / cols) * (h + gap), w, h }, areaW, areaH));
}

export function bringToFront(list: NewsScreen[], id: string): NewsScreen[] {
  const top = list.reduce((m, s) => Math.max(m, s.z), 0);
  return list.map((s) => (s.id === id && s.z !== top ? { ...s, z: top + 1 } : s));
}

/** Parse stored screens, dropping anything malformed. */
export function parseStored(raw: string | null): NewsScreen[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter((s): s is NewsScreen => s && typeof s.id === "string" && typeof s.country === "string" && [s.x, s.y, s.w, s.h, s.z].every((n) => typeof n === "number" && Number.isFinite(n)))
      .map((s) => ({ ...s, min: !!s.min })).slice(0, MAX_SCREENS);
  } catch { return []; }
}
