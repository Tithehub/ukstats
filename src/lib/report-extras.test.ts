import { describe, expect, it } from "vitest";
import { headlinesByCountry, travelRows, ukHeadlines } from "./report-extras";
import type { OfficialWarning } from "./unrest";
import type { ReportItem } from "./news-reports";

const now = new Date("2026-11-07T12:00:00Z");
const w = (country: string, source: OfficialWarning["source"], level: number | null, unrest = false): OfficialWarning =>
  ({ source, country, key: country.toLowerCase(), url: `https://x/${country}`, updated: "2026-11-01T00:00:00Z", text: "", level, mentionsUnrest: unrest });
const item = (title: string, published: string, official = false): ReportItem =>
  ({ id: title, kind: "protest", title, summary: "", link: "https://n", published, publisher: "P", official, place: null, lat: null, lng: null });

describe("report travel warnings", () => {
  it("sorts most serious first, then A-Z, and marks unchecked countries", () => {
    const rows = travelRows([w("France", "US State Dept", 2), w("Yemen", "US State Dept", 4), w("Austria", "FCDO", null)],
      { yemen: { status: "all", updated: null, url: "u", checked: "c" } }, now);
    expect(rows.map((r) => r.country)).toEqual(["Yemen", "France", "Austria"]);
    expect(rows[2]!.uk).toBe("Not checked");
    expect(rows[2]!.us).toBe("Not checked");
  });
  it("flags unrest only from the publisher's own recent wording", () => {
    expect(travelRows([w("Peru", "FCDO", null, true)], undefined, now)[0]!.unrest).toBe(true);
    expect(travelRows([w("Peru", "FCDO", null, true)], undefined, new Date("2027-02-01"))[0]!.unrest).toBe(false);
  });
});

describe("report headlines", () => {
  it("keeps at most 3 per country and skips countries with none", () => {
    const items = ["a", "b", "c", "d"].map((s, i) => item(`France ${s}`, `2026-11-0${i + 1}T00:00:00Z`));
    const out = headlinesByCountry(items, ["France", "Spain"]);
    expect(out).toHaveLength(1);
    expect(out[0]!.items.map((i) => i.title)).toEqual(["France d", "France c", "France b"]);
  });
  it("UK section takes at most 5, newest first", () => {
    const items = Array.from({ length: 7 }, (_, i) => item(`London story ${i}`, `2026-11-0${i + 1}T00:00:00Z`));
    expect(ukHeadlines(items).map((i) => i.title)[0]).toBe("London story 6");
    expect(ukHeadlines(items)).toHaveLength(5);
  });
});
