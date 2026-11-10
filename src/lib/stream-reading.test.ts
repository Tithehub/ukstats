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

import { scriptForPromo } from "./stream-script";
import { promoAt } from "./stream-schedule";
describe("About UKStats break", () => {
  it("runs at the start of every quarter-hour only", () => {
    for (const q of [0, 15, 45]) expect(promoAt(q * 60_000 + 5_000).active).toBe(true);
    expect(promoAt(7 * 60_000).active).toBe(false);
    expect(promoAt(15 * 60_000 + 41_000).active).toBe(false);
  });
  it("names every sponsor and the domain", () => {
    const s = scriptForPromo(["YachtFino", "RAREITUP", "GoPharma", "Gold.live", "XPRE"]).join(" ");
    expect(s).toContain("supported by YachtFino, RAREITUP, GoPharma, Gold.live and XPRE.");
    expect(s).toContain("ukstats.co.uk");
    expect(s).toContain("scan the QR code");
  });
  it("falls back to the sponsors page with no sponsors", () => {
    expect(scriptForPromo([]).join(" ")).toContain("ukstats.co.uk/sponsors");
  });
});
