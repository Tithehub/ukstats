import { describe, expect, it } from "vitest";
import { feedPins, filterFeed, orderFeed, parsePlaylistItems, parseYoutubeRss, type FeedItem } from "./video-feed";

const ch = { channelId: "UCabc", name: "BBC News", avatar: "a", kind: "msm" as const, country: "united kingdom" };
const item = (id: string, published: string, o: Partial<FeedItem> = {}): FeedItem => ({ id, title: id, published, channelId: "UCabc", channel: "x", avatar: "", kind: "msm", country: "united kingdom", thumb: "", live: false, views: null, ...o });

describe("video feed", () => {
  it("keeps RSS titles exactly as published", () => {
    const xml = `<feed><entry><yt:videoId>v1</yt:videoId><title>PM &amp; MPs: "live"</title><published>2026-11-03T06:00:00+00:00</published><media:statistics views="42"/></entry></feed>`;
    const [v] = parseYoutubeRss(xml, ch);
    expect(v!.title).toBe('PM & MPs: "live"');
    expect(v!.views).toBe(42);
  });
  it("drops private and deleted uploads", () => {
    const j = { items: [{ snippet: { title: "Private video", publishedAt: "2026-11-03T06:00:00Z", resourceId: { videoId: "p" } } }, { snippet: { title: "Real", publishedAt: "2026-11-03T06:00:00Z", resourceId: { videoId: "r" } } }] };
    expect(parsePlaylistItems(j, ch).map((i) => i.id)).toEqual(["r"]);
  });
  it("puts live broadcasts first, then newest", () => {
    const o = orderFeed([item("old", "2026-11-03T01:00:00Z"), item("new", "2026-11-03T06:00:00Z"), item("live", "2026-11-02T01:00:00Z", { live: true })]);
    expect(o.map((i) => i.id)).toEqual(["live", "new", "old"]);
  });
  it("filters by age but always keeps live", () => {
    const now = new Date("2026-11-03T07:00:00Z");
    const f = filterFeed([item("a", "2026-11-03T06:30:00Z"), item("b", "2026-11-03T04:00:00Z"), item("c", "2026-11-01T00:00:00Z", { live: true })], { hours: 1 }, now);
    expect(f.map((i) => i.id)).toEqual(["a", "c"]);
  });
  it("pins only countries with videos in the last 6 hours", () => {
    const now = new Date("2026-11-03T07:00:00Z");
    const p = feedPins([item("a", "2026-11-03T06:00:00Z"), item("b", "2026-11-02T06:00:00Z", { country: "france" })], now);
    expect([...p.keys()]).toEqual(["united kingdom"]);
  });
});
