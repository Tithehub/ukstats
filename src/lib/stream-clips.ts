// Pure rules for stream footage: only open-licence or public-domain clips, never news-outlet footage,
// and never a substitute clip when nothing matches the segment.
import { FUNDING_PAUSED } from "./funding-policy";

export const ALLOWED_LICENCES = ["Public domain (US Government)", "CC0", "CC BY 2.0", "CC BY 3.0", "CC BY 4.0", "CC BY-SA 3.0", "CC BY-SA 4.0"] as const;
export type ClipLicence = (typeof ALLOWED_LICENCES)[number] | "Licensed news (paid)";

export interface StreamClip {
  id: string; url: string; sourcePage: string; licence: ClipLicence; credit: string; publisher: string;
  description: string; published: string; topics: string[]; checkedAt: string;
}

const NEWS_OUTLETS = /\b(bbc|sky news|itv|channel 4|gb news|cnn|fox news|reuters|associated press|\bap\b|al jazeera|euronews|france 24|dw news|guardian|telegraph|daily mail|times radio)\b/i;

/** Licensed (paid) news footage stays off while the funding hold is in place. */
export const LICENSED_NEWS_ENABLED = !FUNDING_PAUSED && false;

export function clipAllowed(c: StreamClip): boolean {
  if (c.licence === "Licensed news (paid)") return LICENSED_NEWS_ENABLED;
  if (!(ALLOWED_LICENCES as readonly string[]).includes(c.licence)) return false;
  return !NEWS_OUTLETS.test(`${c.credit} ${c.publisher}`);
}

/** Clips for a segment id; empty when none match — callers show a "no licensed clip" card. */
export function clipsFor(segmentId: string, clips: StreamClip[]): StreamClip[] {
  return clips.filter((c) => clipAllowed(c) && c.topics.includes(segmentId));
}

export const clipCaption = (c: StreamClip) =>
  `Footage: ${c.credit} · ${c.licence} · ${c.published} — trimmed & muted · not UKStats data`;
