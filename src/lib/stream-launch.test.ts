import { describe, expect, it } from "vitest";
import { cleanStreamLink, shareIntents } from "./stream-launch";

describe("cleanStreamLink", () => {
  it("normalises a YouTube live link and drops tracking", () => {
    expect(cleanStreamLink("https://www.youtube.com/live/j2MJCjRAPHM?si=psP5FIDPFUkI9UbC")).toBe("https://www.youtube.com/live/j2MJCjRAPHM");
  });
  it("accepts watch and youtu.be links", () => {
    expect(cleanStreamLink("https://youtu.be/j2MJCjRAPHM")).toBe("https://www.youtube.com/live/j2MJCjRAPHM");
    expect(cleanStreamLink("https://m.youtube.com/watch?v=j2MJCjRAPHM")).toBe("https://www.youtube.com/live/j2MJCjRAPHM");
  });
  it("rejects non-YouTube or http links", () => {
    expect(cleanStreamLink("https://evil.com/live/j2MJCjRAPHM")).toBeNull();
    expect(cleanStreamLink("http://youtube.com/live/j2MJCjRAPHM")).toBeNull();
  });
});

describe("shareIntents", () => {
  it("puts the stream link into every composer", () => {
    const link = "https://www.youtube.com/live/j2MJCjRAPHM";
    for (const s of shareIntents("Live", link)) expect(s.url).toContain(encodeURIComponent(link));
  });
});
