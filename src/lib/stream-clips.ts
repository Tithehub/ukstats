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

/** Only footage filmed in this year or later ever plays; older clips are never shown. */
export const MIN_FILMED_YEAR = 2026;

/** Every clip that can play is current-year footage; kept for label compatibility. */
export function clipTier(c: StreamClip): ClipTier {
  return c.published >= String(MIN_FILMED_YEAR) ? "newest" : "archive";
}

/** Clips for a topic (and country): only footage filmed from MIN_FILMED_YEAR, newest first; empty when none match. */
export function clipsFor(topic: string, clips: StreamClip[], country?: string, _now: Date = new Date()): StreamClip[] {
  return clips
    .filter((c) => clipAllowed(c) && clipTier(c) === "newest" && c.topics.includes(topic) && (!c.country || !country || c.country === country))
    .sort((a, b) => b.published.localeCompare(a.published));
}

export const clipCaption = (c: StreamClip) =>
  `Filmed ${c.published} · ${c.credit} · ${c.licence} — trimmed & muted · not UKStats data`;
