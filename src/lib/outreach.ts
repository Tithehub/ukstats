// Post templates for the outreach agent. Every draft is assembled from
// published figures — the copy frames the number, it never invents one.

import { SITE_ORIGIN } from "@/lib/share";

export type PlatformKey = "x" | "bluesky" | "linkedin" | "facebook" | "threads" | "reddit" | "mastodon";

export interface Platform {
  key: PlatformKey;
  label: string;
  /** Hard character budget the network enforces, or null when effectively unlimited. */
  limit: number | null;
  /** Composer URL prefilled with the draft. */
  compose: (body: string, url: string, title: string) => string;
  guidance: string;
}

const e = encodeURIComponent;

export const PLATFORMS: Platform[] = [
  {
    key: "x",
    label: "X",
    limit: 280,
    compose: (b) => `https://twitter.com/intent/tweet?text=${e(b)}`,
    guidance: "One figure, the period, both links. No thread.",
  },
  {
    key: "bluesky",
    label: "Bluesky",
    limit: 300,
    compose: (b) => `https://bsky.app/intent/compose?text=${e(b)}`,
    guidance: "Same as X, slightly more room.",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    limit: 2800,
    compose: (_b, u) => `https://www.linkedin.com/sharing/share-offsite/?url=${e(u)}`,
    guidance: "Longer, analytical. Paste the body after the composer opens.",
  },
  {
    key: "facebook",
    label: "Facebook",
    limit: null,
    compose: (_b, u) => `https://www.facebook.com/sharer/sharer.php?u=${e(u)}`,
    guidance: "Link unfurls from the page's own metadata.",
  },
  {
    key: "threads",
    label: "Threads",
    limit: 500,
    compose: (b) => `https://www.threads.net/intent/post?text=${e(b)}`,
    guidance: "Conversational, one figure.",
  },
  {
    key: "reddit",
    label: "Reddit",
    limit: null,
    compose: (b, u, t) => `https://www.reddit.com/submit?url=${e(u)}&title=${e(t)}&text=${e(b)}`,
    guidance: "Read the subreddit rules first. Never drop a bare link.",
  },
  {
    key: "mastodon",
    label: "Mastodon",
    limit: 500,
    compose: (b) => `https://mastodon.social/share?text=${e(b)}`,
    guidance: "Instance-specific — change the host to your own server.",
  },
];

export interface DraftInput {
  metricId: string;
  title: string;
  category: string;
  value: string;
  period: string | null;
  changeLabel: string | null;
  previousValue: string | null;
  source: string;
  sourceUrl: string;
  hasHistory: boolean;
}

export interface Draft {
  id: string;
  kind: "release" | "digest";
  metricId: string | null;
  headline: string;
  /** Canonical UKStats link the post points at. */
  url: string;
  sourceUrl: string;
  bodies: Record<PlatformKey, string>;
}

export function metricUrl(metricId: string, hasHistory: boolean): string {
  return hasHistory ? `${SITE_ORIGIN}/history/${metricId}` : `${SITE_ORIGIN}/register#${metricId}`;
}

function clamp(text: string, limit: number | null): string {
  if (!limit || text.length <= limit) return text;
  // Trim words, never digits: a truncated number would misreport the figure.
  const cut = text.slice(0, limit - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/** Build every platform body for one published figure. */
export function draftForMetric(m: DraftInput): Draft {
  const url = metricUrl(m.metricId, m.hasHistory);
  const period = m.period ? ` (${m.period})` : "";
  const move = m.changeLabel ? ` ${m.changeLabel} on the previous published figure.` : "";
  const prev = m.previousValue ? ` Previously ${m.previousValue}.` : "";
  const headline = `${m.title}: ${m.value}${period}`;

  const short = clamp(`${headline}.${move}\n\nSource: ${m.source}\n${url}`, 280);

  const long =
    `${m.title} now stands at ${m.value}${period}.${move}${prev}\n\n` +
    `Published by ${m.source}. The full published series, with every observation and its reference period, is on UKStats — ` +
    `and the publisher's own release is linked from the page so anything here can be checked at source.\n\n` +
    `UKStats: ${url}\n${m.source}: ${m.sourceUrl}\n\n` +
    `No figure on UKStats is estimated, modelled or interpolated.`;

  return {
    id: `release:${m.metricId}:${m.period ?? m.value}`,
    kind: "release",
    metricId: m.metricId,
    headline,
    url,
    sourceUrl: m.sourceUrl,
    bodies: {
      x: short,
      bluesky: clamp(`${headline}.${move}\n\n${m.source}\n${url}`, 300),
      linkedin: long,
      facebook: `${headline}.${move} Published by ${m.source}.\n\n${url}`,
      threads: clamp(`${headline}.${move}\n\nSource: ${m.source}\n${url}`, 500),
      reddit:
        `${m.title} is ${m.value}${period}, published by ${m.source}.${move}${prev}\n\n` +
        `Publisher's release: ${m.sourceUrl}\nFull published series: ${url}\n\n` +
        `Posting the figure as published — no estimate or projection.`,
      mastodon: clamp(`${headline}.${move}\n\n${m.source}\n${url}`, 500),
    },
  };
}

/** One post covering the pinned vital signs. */
export function draftDigest(rows: DraftInput[], dateLabel: string): Draft | null {
  const usable = rows.filter((r) => r.value);
  if (usable.length < 3) return null;
  const lines = usable.map((r) => `${r.title}: ${r.value}${r.period ? ` (${r.period})` : ""}`);
  const url = `${SITE_ORIGIN}/`;
  const headline = `UK by the numbers — ${dateLabel}`;

  const shortList = lines.slice(0, 3).join("\n");
  const short = clamp(`${headline}\n\n${shortList}\n\nAll sourced, none estimated:\n${url}`, 280);

  return {
    id: `digest:${dateLabel}`,
    kind: "digest",
    metricId: null,
    headline,
    url,
    sourceUrl: SITE_ORIGIN,
    bodies: {
      x: short,
      bluesky: clamp(`${headline}\n\n${lines.slice(0, 4).join("\n")}\n\n${url}`, 300),
      linkedin:
        `${headline}\n\n${lines.join("\n")}\n\n` +
        `Every one of these is the figure the issuing body published, with its reference period and a link back to the ` +
        `original release. Nothing is estimated, modelled or interpolated.\n\n${url}`,
      facebook: `${headline}\n\n${lines.join("\n")}\n\n${url}`,
      threads: clamp(`${headline}\n\n${lines.slice(0, 5).join("\n")}\n\n${url}`, 500),
      reddit: `${headline}\n\n${lines.join("\n")}\n\nEach figure links to the issuing body's own release: ${url}`,
      mastodon: clamp(`${headline}\n\n${lines.slice(0, 5).join("\n")}\n\n${url}`, 500),
    },
  };
}
