// Pure rules for stream footage: only open-licence or public-domain clips, never news-outlet footage,
// and never a substitute clip when nothing matches the segment.
import { FUNDING_PAUSED } from "./funding-policy";

export const ALLOWED_LICENCES = ["Public domain", "Public domain (US Government)", "CC0", "CC BY 2.0", "CC BY 3.0", "CC BY 4.0", "CC BY-SA 2.0", "CC BY-SA 3.0", "CC BY-SA 4.0", "OGL v3.0", "Open Parliament Licence v3.0"] as const;
export type ClipLicence = (typeof ALLOWED_LICENCES)[number] | "Licensed news (paid)";
export type ClipTier = "newest" | "archive";

export interface StreamClip {
  id: string; url: string; sourcePage: string; licence: ClipLicence; credit: string; publisher: string;
  description: string; published: string; topics: string[]; checkedAt: string;
  /** Globe country key; omitted = usable for any country. */
  country?: string;
}

const NEWS_OUTLETS = /\b(bbc|sky news|itv|channel 4|gb news|cnn|fox news|reuters|associated press|\bap\b|al jazeera|euronews|france 24|dw news|guardian|telegraph|daily mail|times radio)\b/i;

/** Licensed (paid) news footage stays off while the funding hold is in place. */
export const LICENSED_NEWS_ENABLED = !FUNDING_PAUSED && false;

export function clipAllowed(c: StreamClip): boolean {
  if (c.licence === "Licensed news (paid)") return LICENSED_NEWS_ENABLED;
  if (!(ALLOWED_LICENCES as readonly string[]).includes(c.licence)) return false;
  return !NEWS_OUTLETS.test(`${c.credit} ${c.publisher}`);
}

/** Main segments use footage filmed within this many months; older clips are archive fallback only. */
export const RECENT_MONTHS = 24;

/** Recent = filmed within RECENT_MONTHS of `now`; anything older (or undated) is archive. */
export function clipTier(c: StreamClip, now: Date = new Date()): ClipTier {
  const cut = new Date(now); cut.setUTCMonth(cut.getUTCMonth() - RECENT_MONTHS);
  return c.published >= cut.toISOString().slice(0, 10) ? "newest" : "archive";
}

/** Clips for a topic (and country): recent ones newest first; archive only when no recent clip exists; empty when none match. */
export function clipsFor(topic: string, clips: StreamClip[], country?: string, now: Date = new Date()): StreamClip[] {
  const ok = clips.filter((c) => clipAllowed(c) && c.topics.includes(topic) && (!c.country || !country || c.country === country));
  const byDate = (a: StreamClip, b: StreamClip) => b.published.localeCompare(a.published);
  const fresh = ok.filter((c) => clipTier(c, now) === "newest").sort(byDate);
  return fresh.length ? fresh : ok.sort(byDate);
}

export const clipCaption = (c: StreamClip) =>
  `Filmed ${c.published} · ${c.credit} · ${c.licence} — trimmed & muted · not UKStats data`;
