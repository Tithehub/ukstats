import { describe, expect, it } from "vitest";
import { normaliseRegions } from "./sponsor-regions";
import { sponsorsForRegion } from "./sponsor-visibility";

const s = (regions: string[]) => [{ id: "x", regions }];

describe("sponsor regions", () => {
  it("Europe shows on France and UK pages but not the US", () => {
    expect(sponsorsForRegion(s(["europe"]), "fr")).toHaveLength(1);
    expect(sponsorsForRegion(s(["europe"]), "uk")).toHaveLength(1);
    expect(sponsorsForRegion(s(["europe"]), "us")).toHaveLength(0);
  });
  it("a multi-country pick shows only on those countries", () => {
    expect(sponsorsForRegion(s(["uk", "ie"]), "ie")).toHaveLength(1);
    expect(sponsorsForRegion(s(["uk", "ie"]), "fr")).toHaveLength(0);
  });
  it("worldwide shows everywhere", () => {
    expect(sponsorsForRegion(s(["all"]), "au")).toHaveLength(1);
  });
  it("old single-region rows still work", () => {
    expect(sponsorsForRegion([{ region: "de" }], "de")).toHaveLength(1);
    expect(sponsorsForRegion([{ region: "de" }], "fr")).toHaveLength(0);
  });
  it("rejects unknown places", () => {
    expect(() => normaliseRegions(["mars"])).toThrow();
  });
});
