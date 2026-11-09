import { describe, expect, it } from "vitest";
import { RACECOURSES } from "./racecourses.data";
import { demoMeetings, demoResults } from "./demo.data";
import { mapRacecards, ukCourse, furlongsToYards } from "./theracingapi";

describe("racing example data", () => {
  it("lists 61 real UK racecourses with unique names", () => {
    expect(RACECOURSES).toHaveLength(61);
    expect(new Set(RACECOURSES.map((c) => c.name)).size).toBe(61);
  });
  it("keeps only UK courses from The Racing API", () => {
    expect(ukCourse("Wolverhampton (AW)")?.name).toBe("Wolverhampton");
    expect(ukCourse("Chantilly")).toBeNull();
    expect(ukCourse("Down Royal")?.nation).toBe("Northern Ireland");
    const m = mapRacecards([{ race_id: "r1", course: "Carlisle", date: "2026-11-09", off_dt: "2026-11-09T13:00:00+00:00", race_name: "X", distance_f: "16.0", runners: [] }, { race_id: "r2", course: "Chantilly", date: "2026-11-09", off_dt: "2026-11-09T10:40:00+00:00", race_name: "Y", runners: [] }]);
    expect(m.map((x) => x.course?.name)).toEqual(["Carlisle"]);
    expect(furlongsToYards("8.0")).toBe(1760);
  });
  it("uses demo ids and real courses only", () => {
    const names = new Set(RACECOURSES.map((c) => c.name));
    for (const m of demoMeetings("2026-11-09", "2026-11-10")) {
      expect(names.has(m.course!.name)).toBe(true);
      for (const r of m.races) for (const x of r.runners) expect(x.horse!.id.startsWith("demo-")).toBe(true);
    }
  });
  it("never invents starting prices", () => { expect(demoResults(new Date("2026-11-09T12:00:00Z")).every((r) => r.starting_price_decimal === null)).toBe(true); });
});
