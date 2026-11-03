import { describe, expect, it } from "vitest";
import { classifyUnrest, unrestMarkers, type OfficialWarning, type Place } from "./unrest";

const places: Place[] = [["France", "Paris", 48.86, 2.35, 1], ["France", "Marseille", 43.3, 5.37, 0]];
const now = new Date("2026-11-03T12:00:00Z");
const w = (text: string, updated = "2026-11-01T10:00:00Z"): OfficialWarning => ({ source: "FCDO", country: "France", key: "france", url: "https://www.gov.uk/foreign-travel-advice/france", updated, text, level: null, mentionsUnrest: true });

describe("unrest markers", () => {
  it("places riots named in Marseille on Marseille", () => {
    const [m] = unrestMarkers([w("Riots in Marseille")], now, places);
    expect(m).toMatchObject({ kind: "riot", place: "Marseille", unspecified: false });
  });
  it("puts unnamed protests on the capital, flagged unspecified", () => {
    const [m] = unrestMarkers([w("Demonstrations may occur")], now, places);
    expect(m).toMatchObject({ kind: "protest", place: "Paris", unspecified: true });
  });
  it("adds no marker when the wording mentions no unrest", () => {
    expect(unrestMarkers([w("Updated entry requirements")], now, places)).toEqual([]);
  });
  it("drops warnings older than 30 days", () => {
    expect(unrestMarkers([w("Riots in Paris", "2026-09-01T00:00:00Z")], now, places)).toEqual([]);
  });
  it("classifies wording", () => {
    expect(classifyUnrest("civil disorder")).toBe("riot");
    expect(classifyUnrest("strikes planned")).toBe("protest");
    expect(classifyUnrest("risk of missile strikes and drone attacks")).toBe("strike");
    expect(classifyUnrest("there is an ongoing armed conflict")).toBe("war");
  });
});
