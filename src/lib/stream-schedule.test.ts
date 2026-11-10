import { describe, expect, it } from "vitest";
import { buildUkHour, HOUR_MS, positionAt, sponsorBreakAt, ukSlotAt, worldCountryAt } from "./stream-schedule";
import { countrySegment, type Segment } from "./stream-rundown";

const seg = (id: string): Segment => ({ id, title: id, country: "united kingdom", topic: id, layers: { fl: false, mg: false, nw: false }, cards: [{ kicker: "", title: id, value: "1", sub: null, source: "ONS", period: null, asOf: null, nextDue: null, metric: null }], headlines: [] });
const all = ["boats", "economy", "cost", "crime", "nhs", "legal", "security", "flights", "news"].map(seg);

describe("stream schedule", () => {
  it("fills exactly one hour, opens on headlines then small boats as a major issue", () => {
    const h = buildUkHour(all);
    expect(h[0]!.start).toBe(0);
    expect(h.at(-1)!.end).toBe(HOUR_MS);
    expect(h[0]!.seg.id).toBe("top-story");
    expect(h[1]!.seg.id).toBe("boats-headline");
    expect(h[1]!.seg.headline).toBe(true);
  });
  it("runs headlines again at half past when every topic is published", () => {
    const full = [...all, ...["weather", "population", "housing", "politics", "warnings", "foreign-aid", "asylum-cost", "scandals", "gold", "tax-welfare", "council-spending", "education", "safest", "online-speech"].map(seg)];
    const half = buildUkHour(full).find((s) => s.seg.id === "news-half")!;
    expect(half.start).toBe(30 * 60_000);
  });
  it("cuts to a 60-second sponsor break after the :15 and :45 promo only", () => {
    expect(sponsorBreakAt(15 * 60_000 + 40_000).active).toBe(true);
    expect(sponsorBreakAt(45 * 60_000 + 99_000).active).toBe(true);
    expect(sponsorBreakAt(16 * 60_000 + 40_000).active).toBe(false);
    expect(sponsorBreakAt(30 * 60_000 + 50_000).active).toBe(false);
  });
  it("brings small boats back at least three times in the UK hour", () => {
    expect(buildUkHour(all).filter((s) => s.seg.topic === "boats").length).toBeGreaterThanOrEqual(3);
  });
  it("drops topics without published figures and still fills the hour", () => {
    const h = buildUkHour(all.filter((s) => s.id !== "crime" && s.id !== "nhs"));
    expect(h.some((s) => s.seg.id === "crime")).toBe(false);
    expect(h.at(-1)!.end).toBe(HOUR_MS);
  });
  it("alternates UK hour and world hour by the London clock", () => {
    const a = positionAt(new Date("2026-11-04T18:10:00Z"));
    const b = positionAt(new Date("2026-11-04T19:10:00Z"));
    expect(a.mode).not.toBe(b.mode);
    expect(ukSlotAt(buildUkHour(all), 0).index).toBe(0);
  });
  it("gives each country five minutes in a world hour", () => {
    const pos = { mode: "world" as const, hourIndex: 1, msIntoHour: 6 * 60_000 };
    const r = worldCountryAt(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m"], pos);
    expect(r.index).toBe(1);
  });
  it("other countries show only figures they actually publish", () => {
    const s = countrySegment("france", { country: { name: "France" } as never, fetchedAt: "", metrics: [
      { id: "a", title: "GDP", value: "2%", period: "Q2", asOf: null } as never,
      { id: "b", title: "Debt", value: null, period: null, asOf: null } as never,
    ] }, [], new Date());
    expect(s.cards.map((c) => c.title)).toEqual(["GDP"]);
  });
});
