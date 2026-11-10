import { describe, expect, it } from "vitest";
import { buildRundown, scandalsSegment } from "./stream-rundown";
import { buildUkHour, SPONSOR_BREAK_MS, SPONSOR_BREAK_STARTS } from "./stream-schedule";
import { readingList, scriptForCard } from "./stream-script";
import type { Metric } from "./uk-stats";

const m = (id: string, title: string): Metric => ({ id, title, value: "£1bn", status: "ok", category: "Finance", source: "ONS", period: "2025", asOf: null, nextDue: null, sub: null } as unknown as Metric);
const base = { warnings: [], reports: [], emergencyPlanes: null, now: new Date("2026-11-10T12:00:00Z") };
const own = buildRundown({ ...base, metrics: [m("uk-foreign-aid", "Total UK foreign aid spend"), m("uk-irregular-cost-year", "Cost of asylum support per year"), m("x", "Debt")], siteSections: true });

describe("UK hour running order", () => {
  it("leads with foreign aid then asylum cost", () => {
    const ids = buildUkHour(own).map((s) => s.seg.id);
    expect(ids.slice(0, 2)).toEqual(["foreign-aid", "asylum-cost"]);
  });
  it("has two 60-second sponsor breaks", () => {
    expect(SPONSOR_BREAK_STARTS).toHaveLength(2);
    expect(SPONSOR_BREAK_MS).toBe(60_000);
  });
  it("alternates education and happiest places by UK block", () => {
    const a = buildUkHour(own, 0).map((s) => s.seg.id), b = buildUkHour(own, 3).map((s) => s.seg.id);
    expect(a).toContain("education"); expect(a).not.toContain("happiest");
    expect(b).toContain("happiest"); expect(b).not.toContain("education");
  });
  it("scandals carry no figures and point to the site", () => {
    const s = scandalsSegment();
    expect(s.cards).toHaveLength(0);
    expect(s.script!.join(" ")).not.toMatch(/\d/);
    expect(s.script!.some((l) => l.includes("ukstats.co.uk"))).toBe(true);
  });
  it("every slot is voiced", () => {
    for (const s of buildUkHour(own)) expect(readingList(s.seg).length).toBeGreaterThan(0);
  });
  it("rented channels get no scandals or site sections", () => {
    const ids = buildRundown({ ...base, metrics: [] }).map((s) => s.id);
    expect(ids).not.toContain("scandals"); expect(ids).not.toContain("gold");
  });
});

describe("UK part 2 goes deeper", () => {
  it("reads the card's period, publication and next-release dates", () => {
    const card = { kicker: "", title: "Net debt", value: "£2.8tn", sub: null, source: "ONS", period: "Sep 2026", asOf: "21 Oct 2026", nextDue: "21 Nov 2026", metric: null };
    const deep = scriptForCard(card, true);
    expect(deep).toContain("September twenty twenty-six"); expect(deep).toContain("21 Oct 2026"); expect(deep).toContain("21 Nov 2026");
    expect(scriptForCard(card)).not.toContain("21 Nov 2026");
  });
});

import { scriptForCard as _sfc } from "./stream-script";
describe("spoken dates", () => {
  it("never reads raw timestamps aloud", () => {
    const line = _sfc({ id: "x", title: "Street-level crimes near Westminster", value: "1,234", sub: null, source: "Police.uk", period: "August 2026", asOf: "2026-09-15T00:00:00.000Z", nextDue: "2026-11-15T00:00:00.000Z", metric: null } as never, true);
    expect(line).toContain("Published the fifteenth of September, twenty twenty-six.");
    expect(line).toContain("Next update due the fifteenth of November, twenty twenty-six.");
    expect(line).not.toMatch(/T\d{2}:|\.000Z|\d{4}-\d{2}-\d{2}/);
  });
});

import { SCANDAL_IMAGES } from "./scandals.images";
describe("scandals slot pictures", () => {
  it("names each scandal read, with its own site picture or none", () => {
    const seg = scandalsSegment();
    expect(seg.scandals?.length).toBe(3);
    expect(seg.script?.length).toBe(6);
    expect(seg.scandals![0]!.slug).toBe("grooming-gangs");
    expect(SCANDAL_IMAGES["grooming-gangs"]?.alt).toBe("Rotherham town centre");
  });
});

import { speakable, lineAt, lineMs } from "./stream-script";
import { goldSegment } from "./stream-rundown";
describe("voice clean-up and sync", () => {
  it("never speaks raw dates or timestamps", () => {
    const out = speakable("Published 2026-09-15T00:00:00.000Z. Period 2026-11-10. Gold 2026-M08.");
    expect(out).toBe("Published the fifteenth of September, twenty twenty-six. Period the tenth of November, twenty twenty-six. Gold August twenty twenty-six.");
    expect(out).not.toMatch(/T\d{2}:|\d{4}-\d{2}|Z\b/);
  });
  it("screen line at any moment is the one whose speaking time covers it", () => {
    const reads = ["one two three", "a much longer line ".repeat(10).trim(), "last"];
    expect(lineAt(reads, 0).index).toBe(0);
    expect(lineAt(reads, lineMs(reads[0]!) - 1).index).toBe(0);
    expect(lineAt(reads, lineMs(reads[0]!)).index).toBe(1);
    expect(lineAt(reads, lineMs(reads[0]!) + lineMs(reads[1]!)).index).toBe(2);
    expect(lineMs("short")).toBe(6000);
  });
  it("gold slot reads the ranked IMF table in order, with the UK's rank", () => {
    const row = (iso3: string, name: string, tonnes: number) => ({ iso3, name, tonnes, ounces: 0, period: "2026-M08", site: null });
    const seg = goldSegment({ ranked: [row("USA", "United States", 8133.46), row("DEU", "Germany", 3350.2), row("GBR", "United Kingdom", 310.3)], flagged: [] });
    expect(seg.script![1]).toBe("Number one, United States, 8,133 tonnes. Number two, Germany, 3,350 tonnes.");
    const total = seg.script!.reduce((a, l) => a + lineMs(l), 0);
    expect(total).toBeLessThanOrEqual(60_000);
    expect(seg.script).toContain("The United Kingdom is number 3, with 310 tonnes, as of August 2026.");
    expect(seg.gold!.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(goldSegment(null).script![0]).toMatch(/couldn't be loaded/);
  });
});

describe("dates in spoken English", () => {
  it("reads UK slash dates day first", () => expect(speakable("10/11/2026")).toBe("the tenth of November, twenty twenty-six"));
  it("reads written dates", () => expect(speakable("Due 1 November 2026.")).toBe("Due the first of November, twenty twenty-six."));
  it("reads short month dates", () => expect(speakable("21 Oct 2026")).toBe("the twenty-first of October, twenty twenty-six"));
  it("reads month and year", () => expect(speakable("Period Sep 2026")).toBe("Period September twenty twenty-six"));
  it("reads early-2000s years", () => expect(speakable("3/2/2005")).toBe("the third of February, two thousand and five"));
});
