import { describe, expect, it } from "vitest";
import { FIGURES, RECOMMENDATIONS, STATUS, TIMELINE } from "./grooming-inquiry.data";
import { finalReportLabel, recommendationCounts, sortedTimeline } from "./grooming-inquiry";

describe("grooming inquiry", () => {
  it("lists all twelve Casey recommendations", () => {
    expect(RECOMMENDATIONS).toHaveLength(12);
    expect(recommendationCounts().accepted + recommendationCounts()["in progress"]).toBe(12);
  });
  it("every timeline entry and figure has an https official source", () => {
    for (const e of [...TIMELINE, ...FIGURES]) expect(e.source.url).toMatch(/^https:\/\//);
  });
  it("timeline is sorted oldest first", () => {
    const t = sortedTimeline();
    expect(t[0].date <= t[t.length - 1].date).toBe(true);
  });
  it("shows the final report as not published until it exists", () => {
    expect(finalReportLabel(STATUS.finalReport)).toBe("Not yet published");
  });
});
