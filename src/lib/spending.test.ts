import { describe, expect, it } from "vitest";
import { categorySourcesFor, councilBySlug, searchCouncils } from "./spending";
import { COUNCILS, EXPENDITURE_CATEGORIES, SPENDING_SOURCES } from "./spending.data";

describe("spending directory", () => {
  it("every link is https on an official or FOI domain", () => {
    const urls = [...SPENDING_SOURCES.map((s) => s.url), ...COUNCILS.flatMap((c) => [c.website, c.whatDoTheyKnow])];
    for (const u of urls) expect(u).toMatch(/^https:\/\/(www\.)?[a-z0-9.-]+\.(gov\.uk|gov\.scot|gov\.wales|whatdotheyknow\.com)(\/|$)/);
  });

  it("every category cites at least one known source", () => {
    const ids = new Set(SPENDING_SOURCES.map((s) => s.id));
    for (const c of EXPENDITURE_CATEGORIES) {
      expect(c.sourceIds.length).toBeGreaterThan(0);
      for (const id of c.sourceIds) expect(ids.has(id)).toBe(true);
    }
  });

  it("a Scottish council never gets England's return", () => {
    expect(categorySourcesFor("adult-social-care", councilBySlug("glasgow")!)).toEqual(["scot-lfr"]);
  });

  it("public health has no Welsh source, so Cardiff gets none", () => {
    expect(categorySourcesFor("public-health", councilBySlug("cardiff")!)).toEqual([]);
  });

  it("town search lands on the covering council", () => {
    expect(searchCouncils("leith").map((c) => c.slug)).toEqual(["edinburgh"]);
  });
});
