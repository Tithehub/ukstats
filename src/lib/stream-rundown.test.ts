import { describe, expect, it } from "vitest";
import { buildRundown, publishedIn } from "./stream-rundown";
import type { Metric } from "./uk-stats";

const m = (id: string, category: Metric["category"], value: string | null, status: Metric["status"] = "ok") =>
  ({ id, category, title: id, source: "ONS", sourceUrl: "", value, sub: null, period: "Sep 2026", asOf: null, nextDue: null,
     cadence: "", change: null, spark: [], status, note: null }) as Metric;
const now = new Date("2026-11-04T00:00:00Z");

describe("stream rundown", () => {
  it("never shows unpublished figures", () => {
    expect(publishedIn([m("a", "Finance", null, "no-feed"), m("b", "Finance", "£2.8tn")], ["Finance"]).map((x) => x.id)).toEqual(["b"]);
  });
  it("skips segments with no published figures", () => {
    const ids = buildRundown({ metrics: [m("debt", "Finance", "£2.8tn")], warnings: [], reports: [], emergencyPlanes: null, now }).map((s) => s.id);
    expect(ids).toEqual(["economy"]);
  });
  it("uses only official warnings mentioning unrest within 30 days", () => {
    const w = (updated: string, mentionsUnrest = true) => ({ source: "FCDO" as const, country: "France", key: "france", url: "", updated, text: "Protests", level: null, mentionsUnrest });
    const segs = buildRundown({ metrics: [], warnings: [w("2026-09-01T00:00:00Z"), w("2026-11-01T00:00:00Z", false)], reports: [], emergencyPlanes: null, now });
    expect(segs).toEqual([]);
  });
});
