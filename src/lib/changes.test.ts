import { describe, expect, it } from "vitest";
import { computeChanges } from "./changes";

describe("computeChanges", () => {
  it("compares against the same period one and ten years earlier", () => {
    const pts = [
      { label: "2016 AUG", value: 100 },
      { label: "2025 AUG", value: 180 },
      { label: "2026 JUL", value: 190 },
      { label: "2026 AUG", value: 200 },
    ];
    const c = computeChanges(pts);
    expect(c.map((x) => x.diff)).toEqual([10, 20, 100]);
    expect(c[2].pct).toBe(100);
  });
  it("omits comparisons whose period was never published", () => {
    const c = computeChanges([{ label: "2025 Q1", value: 1 }, { label: "2026 Q1", value: 2 }]);
    expect(c.map((x) => x.label)).toEqual(["Since previous release", "Over 1 year"]);
  });
});
