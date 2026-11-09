import { describe, it, expect } from "vitest";
import { racingVisible } from "./visibility";

describe("racing visibility before launch", () => {
  it("is hidden on the published sites", () => {
    for (const h of ["ukstats.co.uk", "www.ukstats.co.uk", "stats.solutions", "stat-central-uk.lovable.app"]) expect(racingVisible(h)).toBe(false);
  });
  it("shows in previews", () => {
    expect(racingVisible("id-preview--e76fbc4b-e60e-4e6a-b8cb-a3c8dfffab79.lovable.app")).toBe(true);
    expect(racingVisible("localhost:8080")).toBe(true);
  });
});
