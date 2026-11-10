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

import { yoyLine } from "./stream-script";
import { yearEarlierLabel } from "./uk-stats.functions";
describe("year-on-year line", () => {
  const card = (metric: any) => ({ kicker: "", title: "Debt", value: "£2.9tn", sub: null, source: "ONS", period: null, asOf: null, nextDue: null, metric } as any);
  it("says up with last year's figure", () => expect(yoyLine(card({ yearAgo: { value: "£2.7tn", period: "2025 SEP", diff: "£0.2tn", dir: "up" } }))).toBe("That's up £0.2tn on a year earlier, from £2.7tn in 2025 SEP."));
  it("uses percentage points", () => expect(yoyLine(card({ yearAgo: { value: "4.1%", period: "2025 Q3", diff: "0.3 percentage points", dir: "down" } }))).toContain("down 0.3 percentage points"));
  it("never guesses a missing year", () => expect(yoyLine(card({}))).toBe("No year-earlier figure is published."));
  it("skips already-annual measures", () => expect(yoyLine(card({ annualChange: true }))).toBe("That's the change over the past twelve months."));
  it("matches the same period", () => { expect(yearEarlierLabel("2026 SEP")).toBe("2025 SEP"); expect(yearEarlierLabel("2026 Q3")).toBe("2025 Q3"); });
});

import { explainerChapters } from "@/lib/stream-explainer";
import { scriptForSponsorBreak as sbk, lineMs as lm, SPONSOR_CARD_MS as CARD } from "@/lib/stream-script";
describe("explainer and sponsor timing", () => {
  it("gives every explainer line at least its speaking time", () => {
    for (const c of explainerChapters()) c.lines.forEach((l, i) => expect(c.lineMs[i]!).toBeGreaterThanOrEqual(lm(l)));
  });
  it("fits every sponsor-break line inside its 10-second card", () => {
    const rows = [{ name: "YachtFino", label: "yachtfino.com" }, { name: "SS GLOBAL Legal Services", label: "ssgloballegalservices.com" }];
    for (let t = 0; t < 60_000; t += CARD) expect(lm(sbk(rows, t)!.line)).toBeLessThanOrEqual(CARD);
  });
});
