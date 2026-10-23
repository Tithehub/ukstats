import { describe, expect, it } from "vitest";
import { compareBoatYears, completeBoatWindow } from "./small-boats-comparison";

const rows = (year: number, amount: number) => Array.from({ length: 3 }, (_, index) => ({ date: `${year}-01-0${index + 1}`, arrivals: amount, boats: 1 }));

describe("comparable published boat windows", () => {
  it("compares the same January cutoff, not a partial year with a whole year", () => {
    const result = compareBoatYears([...rows(2025, 10), ...rows(2026, 15)]);
    expect(result?.current?.arrivals).toBe(45);
    expect(result?.previous?.arrivals).toBe(30);
    expect(result?.percent).toBe(50);
    expect(result?.previousTo).toBe("2025-01-03");
  });
  it("withholds a total when one day is missing", () => {
    expect(completeBoatWindow(rows(2026, 15).slice(1), "2026-01-01", "2026-01-03")).toBeNull();
  });
  it("withholds a window with duplicate dates even when its row count matches", () => {
    const sample = rows(2026, 15);
    expect(completeBoatWindow([sample[0], sample[0], sample[2]], "2026-01-01", "2026-01-03")).toBeNull();
  });
  it("does not calculate a percentage against zero", () => {
    expect(compareBoatYears([...rows(2025, 0), ...rows(2026, 15)])?.percent).toBeNull();
  });
});