import { describe, expect, it } from "vitest";
import { clipAllowed, clipsFor, clipsForCard, clipTier, type StreamClip } from "./stream-clips";
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
    expect(clipsFor("no-such-topic", STREAM_CLIPS)).toEqual([]);
  });
  it("plays only footage filmed in 2026 or later, newest first", () => {
    const out = clipsFor("crime", [clip({ id: "old", published: "2010-01-01" }), clip({ id: "a", published: "2025-12-31" }), clip({ id: "b", published: "2026-06-01" }), clip({ id: "c", published: "2026-01-02" })]);
    expect(out.map((c) => c.id)).toEqual(["b", "c"]);
  });
  it("shows nothing rather than footage older than 2026", () => {
    expect(clipsFor("crime", [clip({ id: "a", published: "2025-12-31" }), clip({ id: "older", published: "1897" })])).toEqual([]);
  });
  it("keeps country-tagged clips to their own country", () => {
    expect(clipsFor("crime", [clip({ country: "united states", published: "2026-05-01" })], "france")).toEqual([]);
  });
  it("puts the clip matching the figure on screen first", () => {
    const cs = [clip({ id: "rail", published: "2026-09-01", topics: ["cost"], keywords: ["rail"] }), clip({ id: "food", published: "2026-02-01", topics: ["cost"], keywords: ["inflation", "food"] })];
    expect(clipsForCard("CPI inflation, food prices", "cost", cs)[0]!.id).toBe("food");
    expect(clipsForCard("Rail fares index", "cost", cs)[0]!.id).toBe("rail");
  });
  it("falls back to the topic's clips, newest first, when no keyword matches", () => {
    const cs = [clip({ id: "a", published: "2026-02-01", topics: ["cost"], keywords: ["food"] }), clip({ id: "b", published: "2026-09-01", topics: ["cost"] })];
    expect(clipsForCard("Council tax", "cost", cs).map((c) => c.id)).toEqual(["b", "a"]);
  });
  it("a keyword match never brings in pre-2026, other-country or news-outlet clips", () => {
    const cs = [clip({ published: "2025-06-01", keywords: ["police"] }), clip({ published: "2026-06-01", country: "united states", keywords: ["police"] }), clip({ published: "2026-06-01", credit: "BBC News", keywords: ["police"] })];
    expect(clipsForCard("Police recorded crime", "crime", cs, "united kingdom")).toEqual([]);
  });
  it("every shipped clip passes the rules", () => {
    expect(STREAM_CLIPS.every(clipAllowed)).toBe(true);
  });
});
