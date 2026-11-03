// Pure helpers for the globe's live video feed. Items come only from the verified channels in
// broadcast-channels.data.ts; titles are kept exactly as published. Never creates warnings or figures.
import type { BroadcastKind } from "./broadcast-channels.data";

export interface FeedItem {
  id: string; title: string; published: string; channelId: string; channel: string;
  avatar: string; kind: BroadcastKind; country: string; thumb: string; live: boolean; views: number | null;
}
export interface FeedPayload { items: FeedItem[]; fetchedAt: string; connected: boolean; error: string | null; cursor: number }

type Ch = { channelId: string; name: string; avatar: string; kind: BroadcastKind; country: string };
const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
const unescape = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/** YouTube channel RSS (videos.xml). */
export function parseYoutubeRss(xml: string, ch: Ch): FeedItem[] {
  const out: FeedItem[] = [];
  for (const e of xml.split("<entry>").slice(1)) {
    const id = /<yt:videoId>([^<]+)</.exec(e)?.[1];
    const title = /<title>([^<]*)</.exec(e)?.[1];
    const pub = /<published>([^<]+)</.exec(e)?.[1];
    if (!id || !title || !pub || isNaN(Date.parse(pub))) continue;
    const views = /<media:statistics views="(\d+)"/.exec(e)?.[1];
    out.push({ id, title: unescape(title), published: new Date(pub).toISOString(), ...base(ch), thumb: thumb(id), live: false, views: views ? Number(views) : null });
  }
  return out;
}
const base = (ch: Ch) => ({ channelId: ch.channelId, channel: ch.name, avatar: ch.avatar, kind: ch.kind, country: ch.country });

/** YouTube Data API playlistItems.list (uploads playlist). */
export function parsePlaylistItems(json: unknown, ch: Ch): FeedItem[] {
  const items = (json as { items?: { snippet?: { title?: string; publishedAt?: string; resourceId?: { videoId?: string } }; contentDetails?: { videoPublishedAt?: string } }[] })?.items ?? [];
  return items.flatMap((it) => {
    const id = it.snippet?.resourceId?.videoId, title = it.snippet?.title;
    const pub = it.contentDetails?.videoPublishedAt ?? it.snippet?.publishedAt;
    if (!id || !title || !pub || isNaN(Date.parse(pub)) || title === "Private video" || title === "Deleted video") return [];
    return [{ id, title, published: new Date(pub).toISOString(), ...base(ch), thumb: thumb(id), live: false, views: null }];
  });
}

/** YouTube Data API videos.list -> live flags and view counts. */
export function parseVideoStatus(json: unknown): Map<string, { live: boolean; views: number | null }> {
  const items = (json as { items?: { id?: string; snippet?: { liveBroadcastContent?: string }; statistics?: { viewCount?: string } }[] })?.items ?? [];
  return new Map(items.filter((i) => i.id).map((i) => [i.id!, { live: i.snippet?.liveBroadcastContent === "live", views: i.statistics?.viewCount ? Number(i.statistics.viewCount) : null }]));
}

/** Live first, then newest; within the same hour, more views first. */
export function orderFeed(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true))).sort((a, b) => {
    if (a.live !== b.live) return a.live ? -1 : 1;
    const ha = Math.floor(Date.parse(a.published) / 3_600_000), hb = Math.floor(Date.parse(b.published) / 3_600_000);
    if (ha !== hb) return hb - ha;
    if ((b.views ?? 0) !== (a.views ?? 0)) return (b.views ?? 0) - (a.views ?? 0);
    return Date.parse(b.published) - Date.parse(a.published);
  });
}

export type FeedAge = 1 | 6 | 24;
export function filterFeed(items: FeedItem[], f: { kind?: BroadcastKind | undefined; country?: string | undefined; hours?: FeedAge | undefined }, now: Date): FeedItem[] {
  const cut = now.getTime() - (f.hours ?? 24) * 3_600_000;
  return items.filter((i) => (i.live || Date.parse(i.published) >= cut) && (!f.kind || i.kind === f.kind) && (!f.country || i.country === f.country));
}

/** Countries with a live broadcast or a video in the last 6 hours. */
export function feedPins(items: FeedItem[], now: Date): Map<string, { count: number; live: boolean }> {
  const cut = now.getTime() - 6 * 3_600_000, m = new Map<string, { count: number; live: boolean }>();
  for (const i of items) {
    if (!i.live && Date.parse(i.published) < cut) continue;
    const p = m.get(i.country) ?? { count: 0, live: false };
    m.set(i.country, { count: p.count + 1, live: p.live || i.live });
  }
  return m;
}

export function ago(iso: string, now: Date): string {
  const m = Math.max(0, Math.round((now.getTime() - Date.parse(iso)) / 60_000));
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)} h ago` : `${Math.floor(m / 1440)} d ago`;
}
