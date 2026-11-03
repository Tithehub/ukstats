import { describe, expect, it } from "vitest";
import { BROADCAST_CHANNELS } from "./broadcast-channels.data";

const all = Object.values(BROADCAST_CHANNELS).flat();

describe("broadcast channels snapshot", () => {
  it("uses only real YouTube channel ids and YouTube-hosted thumbnails", () => {
    for (const c of all) {
      expect(c.channelId).toMatch(/^UC[\w-]{22}$/);
      expect(new URL(c.avatar).host).toBe("yt3.googleusercontent.com");
      expect(c.handle).toMatch(/^@\w+$/);
    }
  });
  it("never lists the same channel twice or labels a state broadcaster as government", () => {
    expect(new Set(all.map((c) => c.channelId)).size).toBe(all.length);
    expect(all.filter((c) => c.state && c.kind === "official")).toHaveLength(0);
  });
  it("records a subscriber count for every channel", () => {
    for (const c of all) expect(c.subscribers).toBeGreaterThan(0);
  });
});
