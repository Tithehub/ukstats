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
  it("yellow warnings are yellow", () => {
    expect(statusTone(scaled("yellow"))).toBe("yellow");
  });
  it("amber and green levels stay plain", () => {
    expect(statusTone(scaled("amber"))).toBe("plain");
    expect(statusTone(scaled("green"))).toBe("plain");
  });
  it("ordinary figures are never coloured, however fresh", () => {
    expect(statusTone({ ...scaled("red"), scale: null })).toBe("plain");
  });
  it("an unread level or missing figure is plain", () => {
    const m = scaled("red");
    expect(statusTone({ ...m, scale: { ...m.scale!, current: null } })).toBe("plain");
    expect(statusTone({ ...m, value: null })).toBe("plain");
    expect(statusTone(undefined)).toBe("plain");
  });
});
