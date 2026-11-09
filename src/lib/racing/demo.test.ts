import { describe, expect, it } from "vitest";
import { RACECOURSES } from "./racecourses.data";
import { demoMeetings, demoResults } from "./demo.data";
import { PROVIDERS, RACING_DEMO } from "./providers/types";

describe("racing example data", () => {
  it("lists 61 real UK racecourses with unique names", () => {
    expect(RACECOURSES).toHaveLength(61);
    expect(new Set(RACECOURSES.map((c) => c.name)).size).toBe(61);
  });
  it("is on only while no provider is registered", () => { expect(RACING_DEMO).toBe(PROVIDERS.length === 0); });
  it("uses demo ids and real courses only", () => {
    const names = new Set(RACECOURSES.map((c) => c.name));
    for (const m of demoMeetings("2026-11-09", "2026-11-10")) {
      expect(names.has(m.course!.name)).toBe(true);
      for (const r of m.races) for (const x of r.runners) expect(x.horse!.id.startsWith("demo-")).toBe(true);
    }
  });
  it("never invents starting prices", () => { expect(demoResults(new Date("2026-11-09T12:00:00Z")).every((r) => r.starting_price_decimal === null)).toBe(true); });
});
