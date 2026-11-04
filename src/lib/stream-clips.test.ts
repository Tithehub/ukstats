import { describe, expect, it } from "vitest";
import { clipAllowed, clipsFor, type StreamClip } from "./stream-clips";
import { STREAM_CLIPS } from "./stream-clips.data";

const clip = (p: Partial<StreamClip>): StreamClip => ({ id: "x", url: "/v.mp4", sourcePage: "", licence: "CC BY 3.0", credit: "Jane", publisher: "Wikimedia Commons", description: "", published: "2024-01-01", topics: ["crime"], checkedAt: "", ...p });

describe("stream clips", () => {
  it("rejects news-outlet footage even with an open licence", () => {
    expect(clipAllowed(clip({ credit: "BBC News" }))).toBe(false);
    expect(clipAllowed(clip({ publisher: "Sky News" }))).toBe(false);
  });
  it("rejects unknown licences and paid news while the hold is on", () => {
    expect(clipAllowed(clip({ licence: "All rights reserved" as never }))).toBe(false);
    expect(clipAllowed(clip({ licence: "Licensed news (paid)" }))).toBe(false);
  });
  it("never substitutes a clip when nothing matches", () => {
    expect(clipsFor("boats", STREAM_CLIPS)).toEqual([]);
  });
  it("every shipped clip passes the rules", () => {
    expect(STREAM_CLIPS.every(clipAllowed)).toBe(true);
  });
});
