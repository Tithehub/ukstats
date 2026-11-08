import { SCANDALS, type Headline, type Scandal, type Video } from "./scandals.data";

export function findScandal(slug: string): Scandal | undefined {
  return SCANDALS.find((s) => s.slug === slug);
}

/** Newest headlines first; undated never happens because every headline needs a date. */
export function sortedHeadlines(h: Headline[]): Headline[] {
  return [...h].sort((a, b) => b.published.localeCompare(a.published));
}

/** Videos from the official body itself come before broadcaster videos. */
export function orderedVideos(v: Video[]): Video[] {
  return [...v].sort((a, b) => Number(!!b.official) - Number(!!a.official));
}

export function matchScandal(s: Scandal, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return [s.title, s.summary, s.region].some((x) => x.toLowerCase().includes(t));
}

export const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
export const ytUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
