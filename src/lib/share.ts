/** Social share URL builders. Every target opens the public page URL itself. */

export interface ShareTarget {
  key: string;
  label: string;
  href: (url: string, text: string) => string;
}

export const SHARE_TARGETS: ShareTarget[] = [
  { key: "x", label: "X", href: (u, t) => `https://twitter.com/intent/tweet?url=${e(u)}&text=${e(t)}` },
  { key: "facebook", label: "Facebook", href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${e(u)}` },
  { key: "linkedin", label: "LinkedIn", href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${e(u)}` },
  { key: "whatsapp", label: "WhatsApp", href: (u, t) => `https://wa.me/?text=${e(`${t} ${u}`)}` },
  { key: "reddit", label: "Reddit", href: (u, t) => `https://www.reddit.com/submit?url=${e(u)}&title=${e(t)}` },
  { key: "telegram", label: "Telegram", href: (u, t) => `https://t.me/share/url?url=${e(u)}&text=${e(t)}` },
  { key: "bluesky", label: "Bluesky", href: (u, t) => `https://bsky.app/intent/compose?text=${e(`${t} ${u}`)}` },
  { key: "threads", label: "Threads", href: (u, t) => `https://www.threads.net/intent/post?text=${e(`${t} ${u}`)}` },
  { key: "email", label: "Email", href: (u, t) => `mailto:?subject=${e(t)}&body=${e(u)}` },
];

function e(v: string) {
  return encodeURIComponent(v);
}

export const SITE_ORIGIN = "https://ukstats.co.uk";

/** Absolute URL for a path, preferring the live origin in the browser. */
export function absoluteUrl(path: string): string {
  const origin = typeof window === "undefined" ? SITE_ORIGIN : window.location.origin;
  return `${origin}${path}`;
}
