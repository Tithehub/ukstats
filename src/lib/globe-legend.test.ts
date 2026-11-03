import { describe, expect, it } from "vitest";
import { statLayer, NO_FIGURE } from "./globe-legend";
import { filterWarningMarkers, parseFcdoAlert, travelAdviceLevel, type OfficialWarning, type UnrestMarker } from "./unrest";
import type { WorldPayload, WorldIndicator } from "./world";

const ind = { id: "x", slug: "x", label: "X", unit: "rate", higherFirst: true } as WorldIndicator;
const world = {
  countries: [{ name: "France", iso3: "FRA", iso2: "FR" }, { name: "Germany", iso3: "DEU", iso2: "DE" }, { name: "Chad", iso3: "TCD", iso2: "TD" }],
  values: { x: { FRA: { value: 5, year: 2024 }, DEU: { value: 9, year: 2024 }, TCD: { value: 1, year: 2015 } } },
  updated: {}, fetchedAt: "",
} as unknown as WorldPayload;

describe("statLayer", () => {
  it("ranks recent figures and keeps stale ones grey and unranked", () => {
    const l = statLayer(world, ind);
    expect(l.rank.get("germany")).toMatchObject({ rank: 1, of: 2, year: 2024 });
    expect(l.rank.get("france")?.rank).toBe(2);
    expect(l.rank.has("chad")).toBe(false);
    expect(l.fill.get("chad")).toBe(NO_FIGURE);
    expect(l.labels.get("germany")).toContain("rank 1 of 2");
  });
});

describe("FCDO alert status", () => {
  it("takes the most severe of the publisher's own statuses", () => {
    expect(parseFcdoAlert({ details: { alert_status: ["avoid_all_travel_to_parts", "avoid_all_but_essential_travel_to_parts"] } })).toBe("parts-all");
    expect(parseFcdoAlert({ details: { alert_status: ["avoid_all_travel_to_whole_country"] } })).toBe("all");
    expect(parseFcdoAlert({ details: { alert_status: [] } })).toBe("none");
  });
  it("returns null rather than 'none' when the field is missing", () => {
    expect(parseFcdoAlert({ details: {} })).toBeNull();
  });
});

const w = (source: OfficialWarning["source"], updated: string, level: number | null = null): OfficialWarning => ({ source, country: "Italy", key: "italy", url: "https://x", updated, text: "protests", level, mentionsUnrest: true });

describe("travelAdviceLevel", () => {
  it("keeps the two governments' scales separate", () => {
    const a = travelAdviceLevel([w("US State Dept", "2026-11-01", 2)], "italy", { italy: { status: "none", updated: null, url: "u", checked: "c" } });
    expect(a.us?.level).toBe(2);
    expect(a.uk?.status).toBe("none");
  });
  it("reports nothing for a country the FCDO pages have not been checked for", () => {
    expect(travelAdviceLevel([], "italy", {}).uk).toBeNull();
  });
});

describe("filterWarningMarkers", () => {
  const now = new Date("2026-11-03T12:00:00Z");
  const m = (source: OfficialWarning["source"], updated: string, kind: "riot" | "protest"): UnrestMarker => ({ id: source + updated, kind, key: "italy", country: "Italy", place: "Rome", lat: 0, lng: 0, unspecified: true, warning: w(source, updated) });
  const all = [m("FCDO", "2026-11-03T06:00:00Z", "protest"), m("US State Dept", "2026-10-30T00:00:00Z", "riot"), m("FCDO", "2026-10-10T00:00:00Z", "riot")];
  it("filters by government, age and kind", () => {
    expect(filterWarningMarkers(all, { gov: "all", riots: true, protests: true, days: 1 }, now)).toHaveLength(1);
    expect(filterWarningMarkers(all, { gov: "FCDO", riots: true, protests: true, days: 30 }, now)).toHaveLength(2);
    expect(filterWarningMarkers(all, { gov: "all", riots: false, protests: true, days: 30 }, now)).toHaveLength(1);
  });
});
