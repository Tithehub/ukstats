/** Social share URL builders. Every target opens the public page URL itself. */

import {
  AtSign,
  Facebook,
  Linkedin,
  Mail,
  MessageCircle,
  Send,
  Twitter,
  type LucideIcon,
} from "lucide-react";

export interface ShareTarget {
  key: string;
  label: string;
  icon: LucideIcon;
  href: (url: string, text: string) => string;
}

export const SHARE_TARGETS: ShareTarget[] = [
  { key: "x", label: "X", icon: Twitter, href: (u, t) => `https://twitter.com/intent/tweet?url=${e(u)}&text=${e(t)}` },
  { key: "facebook", label: "Facebook", icon: Facebook, href: (u) => `https://www.facebook.com/sharer/sharer.php?u=${e(u)}` },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, href: (u) => `https://www.linkedin.com/sharing/share-offsite/?url=${e(u)}` },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, href: (u, t) => `https://wa.me/?text=${e(`${t} ${u}`)}` },
  { key: "reddit", label: "Reddit", icon: MessageCircle, href: (u, t) => `https://www.reddit.com/submit?url=${e(u)}&title=${e(t)}` },
  { key: "telegram", label: "Telegram", icon: Send, href: (u, t) => `https://t.me/share/url?url=${e(u)}&text=${e(t)}` },
  { key: "bluesky", label: "Bluesky", icon: AtSign, href: (u, t) => `https://bsky.app/intent/compose?text=${e(`${t} ${u}`)}` },
  { key: "threads", label: "Threads", icon: AtSign, href: (u, t) => `https://www.threads.net/intent/post?text=${e(`${t} ${u}`)}` },
  { key: "email", label: "Email", icon: Mail, href: (u, t) => `mailto:?subject=${e(t)}&body=${e(u)}` },
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
