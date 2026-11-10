import { describe, it, expect } from "vitest";
import { buildRundown, countrySegment } from "./stream-rundown";
import { readingList } from "./stream-script";
import { FEATURED_STORY } from "./featured-story.data";

const base = { metrics: [], warnings: [], reports: [], emergencyPlanes: null, now: new Date("2026-11-10T10:00:00Z") };
describe("featured press story in the stream", () => {
  it("adds a UK-hour segment crediting the Financial Times, labelled not official", () => {
    const seg = buildRundown({ ...base, featured: FEATURED_STORY }).find((s) => s.id === "featured");
    expect(seg?.country).toBe("united kingdom");
    const said = readingList(seg).join(" ");
    expect(said).toContain("From Financial Times");
    expect(said).toContain("not official");
  });
  it("is left out when no story is passed (rented channels)", () => {
    expect(buildRundown(base).some((s) => s.id === "featured")).toBe(false);
  });
  it("never appears in world-hour country segments", () => {
    expect(countrySegment("france", null, [], base.now).headlines).toHaveLength(0);
  });
});
