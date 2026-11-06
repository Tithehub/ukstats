import { describe, it, expect } from "vitest";
import { publishedIn, buildRundown, countrySegment } from "./stream-rundown";
import { readingList, NO_HEADLINES } from "./stream-script";

const m = (id: string, category: string, value: string | null = "1") =>
  ({ id, title: id, category, value, status: value ? "ok" : "no-feed", sub: null, source: "ONS", period: null, asOf: null, nextDue: null }) as never;

describe("presenter reading", () => {
  it("does not cap an area at 6 stats", () => {
    expect(publishedIn(Array.from({ length: 9 }, (_, i) => m(`f${i}`, "Finance")), ["Finance"])).toHaveLength(9);
  });
  it("gives weather its own segment", () => {
    const segs = buildRundown({ metrics: [m("rain", "Weather"), m("debt", "Finance")], warnings: [], reports: [], emergencyPlanes: null, now: new Date() });
    expect(segs.find((s) => s.id === "weather")!.cards.map((c) => c.title)).toEqual(["rain"]);
    expect(segs.find((s) => s.id === "economy")!.cards.map((c) => c.title)).toEqual(["debt"]);
  });
  it("says no headlines for a country without any", () => {
    const s = countrySegment("france", { country: { name: "France" }, metrics: [] } as never, [], new Date());
    expect(readingList(s)).toEqual([NO_HEADLINES]);
  });
  it("reads matching country headlines verbatim", () => {
    const s = countrySegment("france", { country: { name: "France" }, metrics: [] } as never, [], new Date(),
      [{ title: "Strikes in France today", publisher: "BBC", published: null, official: false }] as never);
    expect(readingList(s)[0]).toContain("Strikes in France today");
  });
});
