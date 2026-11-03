import { describe, expect, it } from "vitest";
import { countryDestinations } from "./globe-destinations";

const kinds = (a: string, b: string | null, n: string) => countryDestinations(a, b, n).map((d) => d.kind);

describe("countryDestinations", () => {
  it("gives the UK its small boats page", () => {
    expect(kinds("GB", "GBR", "United Kingdom")).toContain("uk-small-boats");
  });
  it("gives no safest-places link where no comparable city data exists", () => {
    expect(kinds("FR", "FRA", "France")).not.toContain("safest");
  });
  it("links US safest places", () => {
    expect(kinds("US", "USA", "United States")).toContain("safest");
  });
  it("lists preparedness only for verified countries", () => {
    expect(kinds("SE", "SWE", "Sweden")).toContain("preparedness");
    expect(kinds("DE", "DEU", "Germany")).not.toContain("preparedness");
  });
  it("lists nothing for a territory without a World Bank profile or registry entry", () => {
    expect(countryDestinations("", null, "Somewhere")).toEqual([]);
  });
});
