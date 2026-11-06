import { describe, expect, it } from "vitest";
import { scriptForCard } from "./stream-script";
import type { StreamCard } from "./stream-rundown";

const card = (o: Partial<StreamCard>): StreamCard => ({ kicker: "K", title: "Small boat arrivals", value: "412", sub: null, source: "Home Office", period: "4 Nov 2026", asOf: "2026-11-05T09:00:00Z", nextDue: null, metric: null, ...o });

describe("scriptForCard", () => {
  it("only speaks numbers that are on the card", () => {
    const s = scriptForCard(card({}));
    const nums = s.match(/\d+/g) ?? [];
    const onCard = `412`;
    for (const n of nums) expect(onCard).toContain(n);
  });
  it("reads missing figures as not published", () => {
    expect(scriptForCard(card({ value: "Not published" }))).toContain("No figure is published.");
    expect(scriptForCard(null)).toBe("No figure is published for this item.");
  });
  it("names the source", () => {
    expect(scriptForCard(card({}))).toContain("Source: Home Office.");
  });
});
