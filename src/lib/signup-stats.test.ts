import { describe, it, expect } from "vitest";
import { bucketByLondonDay } from "./signup-stats";

describe("bucketByLondonDay", () => {
  it("puts a 23:30 UTC summer sign-up on the next London day", () => {
    const b = bucketByLondonDay(["2026-07-01T23:30:00Z"], new Date("2026-07-02T12:00:00Z"), 2);
    expect(b).toEqual([{ day: "2026-07-01", count: 0 }, { day: "2026-07-02", count: 1 }]);
  });
  it("ignores sign-ups older than the window", () => {
    const b = bucketByLondonDay(["2026-01-01T10:00:00Z"], new Date("2026-11-12T12:00:00Z"), 30);
    expect(b.reduce((s, x) => s + x.count, 0)).toBe(0);
    expect(b).toHaveLength(30);
  });
});
