import { describe, expect, it } from "vitest";
import { parseCountries, parseIndicator, rankIndicator, WORLD_INDICATORS, type WorldPayload } from "./world";

const countriesJson = [{}, [
  { id: "GBR", iso2Code: "GB", name: "United Kingdom", region: { id: "ECS", value: "Europe & Central Asia" }, incomeLevel: { value: "High income" }, capitalCity: "London" },
  { id: "FRA", iso2Code: "FR", name: "France", region: { id: "ECS", value: "Europe & Central Asia" }, incomeLevel: { value: "High income" }, capitalCity: "Paris" },
  { id: "OLD", iso2Code: "OL", name: "Oldland", region: { id: "ECS", value: "Europe & Central Asia" }, incomeLevel: { value: "" }, capitalCity: "" },
  { id: "WLD", iso2Code: "1W", name: "World", region: { id: "NA", value: "Aggregates" } },
]];

describe("world bank helpers", () => {
  it("drops aggregates such as 'World'", () => {
    expect(parseCountries(countriesJson).map((c) => c.iso3)).toEqual(["GBR", "FRA", "OLD"]);
  });

  it("ranks only figures within three years of the newest; older ones are unranked", () => {
    const keep = new Set(["GBR", "FRA", "OLD", "WLD"]);
    const ind = WORLD_INDICATORS[0];
    const { values } = parseIndicator([{}, [
      { countryiso3code: "GBR", date: "2025", value: 69 },
      { countryiso3code: "FRA", date: "2024", value: 68 },
      { countryiso3code: "OLD", date: "2015", value: 99 },
      { countryiso3code: "WLD", date: "2025", value: 8000 },
      { countryiso3code: "FRA", date: "2023", value: null },
    ]], keep);
    const p: WorldPayload = { countries: parseCountries(countriesJson), values: { [ind.id]: values }, updated: {}, fetchedAt: "" };
    const rows = rankIndicator(p, ind);
    expect(rows.map((r) => [r.country.iso3, r.rank])).toEqual([["GBR", 1], ["FRA", 2], ["OLD", null]]);
  });
});
