import { describe, expect, it } from "vitest";
import { visibleSponsors, type SponsorVisibilityRow } from "./sponsor-visibility";

const NOW = new Date("2026-10-12T12:00:00.000Z");

function row(over: Partial<SponsorVisibilityRow>): SponsorVisibilityRow {
  return {
    id: "1",
    name: "Acme",
    url: "https://acme.example",
    tagline: null,
    approved: true,
    active: true,
    paid: true,
    environment: "live",
    starts_at: null,
    ends_at: null,
    ...over,
  };
}

const names = (rows: SponsorVisibilityRow[]) => rows.map((r) => r.name);

describe("sponsor visibility", () => {
  it("never shows a test-mode line on the live site", () => {
    const rows = [row({ name: "Real", environment: "live" }), row({ name: "Test", environment: "sandbox" })];
    expect(names(visibleSponsors(rows, "live", NOW))).toEqual(["Real"]);
    expect(names(visibleSponsors(rows, "sandbox", NOW))).toEqual(["Test"]);
  });

  it("hides a line the admin has not approved, is switched off, or is not paid for", () => {
    expect(names(visibleSponsors([row({ approved: false })], "live", NOW))).toEqual([]);
    expect(names(visibleSponsors([row({ active: false })], "live", NOW))).toEqual([]);
    expect(names(visibleSponsors([row({ paid: false })], "live", NOW))).toEqual([]);
  });

  it("hides a line with no test-or-real flag at all", () => {
    expect(names(visibleSponsors([row({ environment: null })], "live", NOW))).toEqual([]);
    expect(names(visibleSponsors([row({ environment: null })], "sandbox", NOW))).toEqual([]);
  });

  it("keeps a line only inside its own window", () => {
    expect(names(visibleSponsors([row({ starts_at: "2026-11-01T00:00:00.000Z" })], "live", NOW))).toEqual([]);
    expect(names(visibleSponsors([row({ ends_at: "2026-10-01T00:00:00.000Z" })], "live", NOW))).toEqual([]);
    expect(
      names(visibleSponsors([row({ starts_at: "2026-10-01T00:00:00.000Z", ends_at: "2026-11-01T00:00:00.000Z" })], "live", NOW)),
    ).toEqual(["Acme"]);
  });
});

import { sponsorsForRegion, regionFromPath, rotationWindow } from "./sponsor-visibility";
describe("regional sponsors", () => {
  const rows = [{ id: "a", region: "all" }, { id: "f", region: "fr" }, { id: "u", region: "uk" }];
  it("France page shows site-wide and French sponsors only", () => {
    expect(sponsorsForRegion(rows, "fr").map((r) => r.id)).toEqual(["a", "f"]);
  });
  it("country path maps to its code, anything else is UK", () => {
    expect(regionFromPath("/fr/crime", ["fr", "de"])).toBe("fr");
    expect(regionFromPath("/gold", ["fr", "de"])).toBe("uk");
  });
  it("rotation shows 3 at a time and wraps", () => {
    expect(rotationWindow([1, 2, 3, 4, 5], 1, 3)).toEqual([4, 5, 1]);
  });
});

import { fairOrder } from "./sponsor-visibility";
describe("fair rotation", () => {
  it("every sponsor appears exactly once per cycle", () => {
    expect(fairOrder(["a", "b", "c"], 4).sort()).toEqual(["a", "b", "c"]);
  });
  it("starting point moves with the seed", () => {
    expect(fairOrder(["a", "b", "c"], 1)[0]).toBe("b");
  });
});
