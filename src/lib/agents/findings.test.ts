import { describe, expect, it } from "vitest";
import { feedWatchdog } from "./findings";
import type { Metric } from "@/lib/uk-stats";

const m = (o: Partial<Metric>): Metric =>
  ({ id: "uk-boats-ethnicity", title: "Ethnicity of irregular arrivals", category: "Migration", source: "Home Office", sourceUrl: "https://homeoffice.gov.uk", value: "12,000", sub: null, period: "Year ending June 2026", asOf: "2026-07-30", nextDue: null, cadence: "Quarterly", change: null, spark: [], status: "ok", note: null, ...o }) as Metric;

describe("feed watchdog", () => {
  it("is a note, not an alarm, for a figure the publisher does not publish", () => {
    const f = feedWatchdog([m({ status: "unavailable", value: null, emptyLabel: "Not published" })]);
    expect(f).toHaveLength(1);
    expect(f[0]!.severity).toBe("info");
    expect(f[0]!.title).toContain("Not published");
  });

  it("warns when a live feed stops answering", () => {
    const f = feedWatchdog([m({ id: "uk-health-alerts", title: "Weather-health alert level", status: "unavailable", value: null })]);
    expect(f).toHaveLength(1);
    expect(f[0]!.severity).toBe("warning");
    expect(f[0]!.title).toContain("source unreachable");
  });

  it("flags a release that is more than two days late", () => {
    const now = Date.parse("2026-10-11T00:00:00Z");
    const f = feedWatchdog([m({ asOf: "2026-08-19", nextDue: "2026-10-01T06:00:00Z" })], now);
    expect(f).toHaveLength(1);
    expect(f[0]!.title).toContain("release overdue");
    expect(f[0]!.detail).toContain("Expected 2026-10-01");
  });

  it("says nothing when the promised release has arrived", () => {
    const now = Date.parse("2026-10-11T00:00:00Z");
    expect(feedWatchdog([m({ asOf: "2026-10-09", nextDue: "2026-10-01T06:00:00Z" })], now)).toHaveLength(0);
  });
});
