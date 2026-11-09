import { describe, expect, it } from "vitest";
import { countUp, sceneFor } from "./stream-orbit";
import type { Segment } from "./stream-rundown";

const seg = (id: string, cards = 1) => ({ id, title: "", country: "united kingdom", topic: id, layers: { fl: false, mg: false, nw: false }, cards: Array(cards).fill({}), headlines: [] }) as unknown as Segment;

describe("sceneFor", () => {
  it("maps segments to scenes", () => {
    expect(sceneFor(seg("warnings", 0))).toBe("warnings");
    expect(sceneFor(seg("news", 0))).toBe("headlines");
    expect(sceneFor(seg("weather"))).toBe("weather");
    expect(sceneFor(seg("flights"))).toBe("flights");
    expect(sceneFor(seg("boats"))).toBe("migration");
    expect(sceneFor(seg("country-france"))).toBe("world");
    expect(sceneFor(seg("economy"))).toBe("stats");
  });
});

describe("countUp", () => {
  it("ends on the exact published value", () => {
    for (const v of ["£2.81tn", "1,234,567", "3.4%", "41,472 people", "Not published"]) expect(countUp(v, 1)).toBe(v);
  });
  it("keeps format while counting", () => {
    expect(countUp("1,000", 0)).toBe("0");
    expect(countUp("£2.81tn", 0)).toBe("£0.00tn");
  });
  it("leaves text without a number untouched", () => {
    expect(countUp("Amber", 0.3)).toBe("Amber");
  });
});

import { sparkPath, tilePage } from "./stream-orbit";
describe("orbit extras", () => {
  it("no trend line without at least two published points", () => {
    expect(sparkPath([], 100, 20)).toBeNull();
    expect(sparkPath([5], 100, 20)).toBeNull();
    expect(sparkPath([1, 3], 100, 20)).toBe("M0.0,20.0 L100.0,0.0");
  });
  it("the card being read is always on the visible page of eight", () => {
    expect(tilePage(12, 9)).toEqual({ idx: 9, start: 8 });
    expect(tilePage(12, 13)).toEqual({ idx: 1, start: 0 });
  });
});

describe("countUp with several numbers", () => {
  it("shows dates and ranges exactly as published, never mid-count", () => {
    for (const v of ["12 Mar 2026", "3 of 12", "2024-25: 1,200"]) expect(countUp(v, 0.4)).toBe(v);
  });
});
