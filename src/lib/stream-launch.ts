/** Pure helpers for the livestream launch composer. */

/** Accept only real YouTube watch/live/short links; return a clean https URL or null. */
export function cleanStreamLink(input: string): string | null {
  let u: URL;
  try {
    u = new URL(input.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = u.pathname.slice(1);
  else if (host === "youtube.com") {
    const m = u.pathname.match(/^\/(?:live|shorts|embed)\/([\w-]{11})/);
    id = m ? m[1]! : u.searchParams.get("v");
  }
  if (!id || !/^[\w-]{11}$/.test(id)) return null;
  return `https://www.youtube.com/live/${id}`;
}

export function defaultLaunchText(): string {
  return "🔴 UKStats is LIVE — official UK figures, warnings and headlines, every one with its source and date.";
}

export interface ShareIntent {
  key: string;
  label: string;
  url: string;
}

/** Composer links for platforms without a connected account (user presses post themselves). */
export function shareIntents(text: string, link: string): ShareIntent[] {
  const t = encodeURIComponent(text);
  const l = encodeURIComponent(link);
  const both = encodeURIComponent(`${text}\n${link}`);
  return [
    { key: "x", label: "X", url: `https://x.com/intent/post?text=${t}&url=${l}` },
    { key: "facebook", label: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${l}` },
    { key: "linkedin", label: "LinkedIn", url: `https://www.linkedin.com/sharing/share-offsite/?url=${l}` },
    { key: "reddit", label: "Reddit", url: `https://www.reddit.com/submit?url=${l}&title=${t}` },
    { key: "whatsapp", label: "WhatsApp", url: `https://wa.me/?text=${both}` },
    { key: "telegram", label: "Telegram", url: `https://t.me/share/url?url=${l}&text=${t}` },
    { key: "bluesky", label: "Bluesky", url: `https://bsky.app/intent/compose?text=${both}` },
    { key: "mastodon", label: "Mastodon", url: `https://mastodon.social/share?text=${both}` },
  ];
}

/** The 11-character video id from a cleaned stream link, or null. */
export function youtubeIdFromLink(link: string): string | null {
  const clean = cleanStreamLink(link);
  return clean ? clean.slice(-11) : null;
}

/** Thumbnail candidates on YouTube's own image host, best first. */
export function youtubeThumbnailUrls(id: string): string[] {
  if (!/^[\w-]{11}$/.test(id)) return [];
  return ["maxresdefault", "hqdefault"].map((n) => `https://i.ytimg.com/vi/${id}/${n}.jpg`);
}
