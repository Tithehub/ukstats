import { describe, expect, it } from "vitest";
import { buildRundown, scandalsSegment } from "./stream-rundown";
import { buildUkHour, SPONSOR_BREAK_MS, SPONSOR_BREAK_STARTS } from "./stream-schedule";
import { readingList } from "./stream-script";
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
  it("alternates education and happiest places by UK hour", () => {
    const a = buildUkHour(own, 0).map((s) => s.seg.id), b = buildUkHour(own, 2).map((s) => s.seg.id);
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
