import { describe, expect, it } from "vitest";
import { countryKey, parseFcdo, parseStateDept, unrestHotspots, warningAge } from "./unrest";

const now = new Date("2026-11-03T00:00:00Z");

describe("unrest feeds", () => {
  it("reads FCDO change notes and flags unrest only from their own words", () => {
    const w = parseFcdo({ links: { children: [
      { base_path: "/foreign-travel-advice/france", public_updated_at: "2026-10-22T16:57:33Z", details: { country: { name: "France" }, change_description: "Updated information about demonstrations" } },
      { base_path: "/foreign-travel-advice/ecuador", public_updated_at: "2026-10-30T00:00:00Z", details: { country: { name: "Ecuador" }, change_description: "Heavy rain and flooding" } },
    ] } });
    expect(w.map((x) => [x.country, x.mentionsUnrest])).toEqual([["France", true], ["Ecuador", false]]);
    expect(w[0]!.url).toBe("https://www.gov.uk/foreign-travel-advice/france");
  });

  it("reads State Dept level from the title", () => {
    const [w] = parseStateDept([{ Title: "Germany - Level 2: Exercise Increased Caution", Link: "https://x", Summary: "<p>Exercise increased caution due to terrorism.</p>", Updated: "2025-05-12" }]);
    expect(w!.level).toBe(2);
    expect(w!.key).toBe("germany");
    expect(w!.mentionsUnrest).toBe(false);
  });

  it("drops unrest warnings older than 30 days from hotspots", () => {
    const base = { source: "FCDO" as const, url: "", text: "", level: null, mentionsUnrest: true };
    const h = unrestHotspots([
      { ...base, country: "France", key: "france", updated: "2026-10-22T00:00:00Z" },
      { ...base, country: "Peru", key: "peru", updated: "2026-09-01T00:00:00Z" },
      { ...base, country: "Chile", key: "chile", updated: null },
    ], now);
    expect([...h.keys()]).toEqual(["france"]);
  });

  it("ages dates and matches aliases", () => {
    expect(warningAge("2026-10-30T00:00:00Z", now)).toBe("fresh");
    expect(warningAge("2026-10-10T00:00:00Z", now)).toBe("ageing");
    expect(warningAge("2026-09-01T00:00:00Z", now)).toBe("overdue");
    expect(countryKey("United States of America")).toBe(countryKey("United States"));
  });
});
