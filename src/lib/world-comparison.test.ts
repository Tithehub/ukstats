import { describe, expect, it } from "vitest";
import { comparisonCountries, comparisonStatus } from "./world-comparison";
import { indicatorBySlug, type WorldPayload } from "./world";

const indicator = indicatorBySlug("population");
const data: WorldPayload = {
  countries: ["GBR", "FRA", "USA", "CAN"].map(iso3 => ({ iso3, iso2: "", name: iso3, region: "", income: "", capital: "" })),
  values: { [indicator.id]: { GBR: { value: 69, year: 2025 }, FRA: { value: 68, year: 2024 }, USA: { value: 340, year: 2025 }, CAN: { value: 40, year: 2021 } } },
  updated: {}, fetchedAt: "2026-10-18",
};
describe("focused country comparison", () => {
  it("limits selection to three distinct source countries", () => {
    expect(comparisonCountries(data, ["gbr", "GBR", "unknown", "FRA", "USA", "CAN"]).map(c => c.iso3)).toEqual(["GBR", "FRA", "USA"]);
  });
  it("flags mismatched reporting years instead of treating them as equivalent", () => {
    expect(comparisonStatus(data, indicator, ["GBR", "FRA"])).toBe("Different reporting years");
    expect(comparisonStatus(data, indicator, ["GBR", "USA"])).toBe("Same indicator and reporting year");
  });
  it("flags missing values without substituting another country", () => {
    expect(comparisonStatus(data, indicator, ["GBR", "XXX"])).toBe("Missing figure");
  });
  it("flags a filing over three years older than the newest", () => {
    expect(comparisonStatus(data, indicator, ["GBR", "CAN"])).toBe("Older filing — not ranked");
  });
});