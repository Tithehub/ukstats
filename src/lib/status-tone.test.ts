import { describe, expect, it } from "vitest";
import { statusTone } from "./status-tone";
import type { Metric } from "./uk-stats";

const scaled = (tone: "green" | "yellow" | "amber" | "red" | "crimson" | "neutral"): Metric => ({
  id: "x", category: "National alerts", title: "t", source: "s", sourceUrl: "u", value: "v", sub: null, period: null,
  asOf: "2026-11-07T00:00:00Z", nextDue: null, cadence: "", change: null, spark: [], status: "ok", note: null,
  scale: { kind: "terror", authority: "a", steps: [{ label: "L", tone }], current: 0 },
});

describe("statusTone", () => {
  it("Severe and Critical terror levels are red", () => {
    expect(statusTone(scaled("red"))).toBe("red");
    expect(statusTone(scaled("crimson"))).toBe("red");
  });
  it("Met Office amber and yellow keep their own colour", () => {
    expect(statusTone(scaled("amber"))).toBe("amber");
    expect(statusTone(scaled("yellow"))).toBe("yellow");
  });
  it("no warnings in force is green", () => {
    expect(statusTone(scaled("green"))).toBe("green");
  });
  it("an unread level or missing figure is never coloured", () => {
    const m = scaled("red");
    expect(statusTone({ ...m, scale: { ...m.scale!, current: null } })).toBe("plain");
    expect(statusTone({ ...m, value: null })).toBe("plain");
    expect(statusTone(undefined)).toBe("plain");
  });
  it("plain figures use freshness: fresh green, 2-week-old amber", () => {
    const now = Date.parse("2026-11-08T00:00:00Z");
    const base = { ...scaled("green"), scale: null };
    expect(statusTone(base, now)).toBe("green");
    expect(statusTone({ ...base, asOf: "2026-10-21T00:00:00Z" }, now)).toBe("amber");
  });
});
