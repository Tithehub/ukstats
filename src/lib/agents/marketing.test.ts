import { describe, expect, it } from "vitest";
import { figureOfDay, releaseDay, tagLink } from "./marketing";
import type { Metric } from "@/lib/uk-stats";

const m = (o: Partial<Metric>): Metric =>
  ({ id: "uk-cpi", title: "CPI inflation", category: "Finance", source: "ONS", sourceUrl: "https://ons.gov.uk", value: "3.1%", sub: null, period: "August 2026", asOf: null, nextDue: null, cadence: "Monthly", change: null, spark: [], status: "ok", note: null, ...o }) as Metric;

describe("marketing agent", () => {
  it("tags links as social traffic", () => {
    expect(tagLink("/x", "bluesky")).toBe("https://ukstats.co.uk/x?utm_source=bluesky&utm_medium=social&utm_campaign=agent");
  });
  it("copies the published value verbatim", () => {
    const posts = figureOfDay([m({})]);
    expect(posts).toHaveLength(2);
    expect(posts[0]!.body).toContain("CPI inflation: 3.1% (August 2026)");
  });
  it("skips figures without a live value", () => {
    expect(figureOfDay([m({ status: "no-feed", value: null })])).toHaveLength(0);
  });
  it("only drafts release posts within 36 hours", () => {
    const now = Date.parse("2026-10-20T00:00:00Z");
    expect(releaseDay([m({ nextDue: "2026-10-21T06:00:00Z" })], now)).toHaveLength(2);
    expect(releaseDay([m({ nextDue: "2026-10-25T06:00:00Z" })], now)).toHaveLength(0);
  });
});
