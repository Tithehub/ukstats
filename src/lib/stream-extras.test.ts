import { describe, expect, it } from "vitest";
import { boatsYearMetric, countdown, justPublished, upcomingReleases } from "./stream-extras";
import type { Metric } from "./uk-stats";

const m = (o: Partial<Metric>): Metric => ({ id: "x", category: "Economy", title: "CPI", source: "ONS", sourceUrl: "", value: "3%", sub: null, period: null, asOf: null, nextDue: null, cadence: "", change: null, spark: [], status: "ok", note: null, ...o }) as Metric;
const now = new Date("2026-11-04T12:00:00Z");

describe("stream extras", () => {
  it("only flags figures published in the last 36 hours", () => {
    const r = justPublished([m({ id: "a", asOf: "2026-11-04T07:00:00Z" }), m({ id: "b", asOf: "2026-11-01T07:00:00Z" }), m({ id: "c", asOf: "2026-11-04T08:00:00Z", status: "unavailable", value: null })], now);
    expect(r.map((x) => x.id)).toEqual(["a"]);
  });
  it("lists future releases soonest first", () => {
    const r = upcomingReleases([m({ id: "a", title: "A", nextDue: "2026-11-10T07:00:00Z" }), m({ id: "b", title: "B", nextDue: "2026-11-05T07:00:00Z" }), m({ id: "c", title: "C", nextDue: "2026-11-01T07:00:00Z" })], now);
    expect(r.map((x) => x.id)).toEqual(["b", "a"]);
  });
  it("formats the countdown", () => {
    expect(countdown("2026-11-06T16:30:00Z", now)).toBe("2d 4h");
    expect(countdown("2026-11-04T12:12:00Z", now)).toBe("12m");
  });
  it("never invents a boats total", () => {
    expect(boatsYearMetric([m({ title: "Small boat arrivals", period: "2026 so far", status: "unavailable", value: null })])).toBeNull();
  });
});
