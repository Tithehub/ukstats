import { describe, expect, it } from "vitest";
import { canDownload, kindsFor, REPORT_PRICES, savingPercent } from "./reports";

const now = new Date("2026-11-07T12:00:00Z");

describe("report prices", () => {
  it("one combined report: daily 75p, weekly £2.49, monthly £9.99, yearly £99", () => {
    expect(REPORT_PRICES.report_combined_daily.pence).toBe(75);
    expect(REPORT_PRICES.report_combined_weekly.pence).toBe(249);
    expect(REPORT_PRICES.report_combined_monthly.pence).toBe(999);
    expect(REPORT_PRICES.report_combined_yearly.pence).toBe(9900);
    expect(Object.keys(REPORT_PRICES)).toHaveLength(4);
  });
  it("savings versus buying every day", () => {
    expect(savingPercent("report_combined_weekly")).toBe(53);
    expect(savingPercent("report_combined_monthly")).toBe(56);
    expect(savingPercent("report_combined_yearly")).toBe(64);
  });
});

describe("report access", () => {
  it("a single-day purchase unlocks only that day", () => {
    const p = [{ edition: "global" as const, report_date: "2026-11-07" }];
    expect(canDownload({ edition: "global", kind: "daily", date: "2026-11-07" }, p, [], now)).toBe(true);
    expect(canDownload({ edition: "global", kind: "daily", date: "2026-11-06" }, p, [], now)).toBe(false);
    expect(canDownload({ edition: "global", kind: "weekly", date: "2026-11-07" }, p, [], now)).toBe(false);
  });
  it("old UK-only buyers and subscribers get the combined report", () => {
    const p = [{ edition: "uk" as const, report_date: "2026-11-07" }];
    expect(canDownload({ edition: "global", kind: "daily", date: "2026-11-07" }, p, [], now)).toBe(true);
    const sub = { edition: "uk" as const, status: "active", current_period_start: null, current_period_end: "2026-11-30T00:00:00Z" };
    expect(canDownload({ edition: "global", kind: "monthly", date: "2026-11-01" }, [], [sub], now)).toBe(true);
  });
  it("subscribers keep access until the paid period ends, even after cancelling", () => {
    const sub = { edition: "global" as const, status: "canceled", current_period_start: null, current_period_end: "2026-11-30T00:00:00Z" };
    expect(canDownload({ edition: "global", kind: "monthly", date: "2026-11-01" }, [], [sub], now)).toBe(true);
    expect(canDownload({ edition: "global", kind: "daily", date: "2026-11-07" }, [], [sub], new Date("2026-12-01"))).toBe(false);
  });
});

describe("schedule", () => {
  it("weekly on Mondays and monthly on the 1st", () => {
    expect(kindsFor("2026-11-02")).toEqual(["daily", "weekly"]);
    expect(kindsFor("2026-12-01")).toEqual(["daily", "monthly"]);
    expect(kindsFor("2026-11-07")).toEqual(["daily"]);
  });
});

import { debtPanel } from "./report-pdf";
import type { Metric } from "./uk-stats";
describe("UK debt panel", () => {
  const m = (o: Partial<Metric>) => ({ id: "uk-national-debt", value: "£2,900bn", period: "September 2026", asOf: "2026-10-21", nextDue: "2026-11-21", source: "ONS", sourceUrl: "https://ons.gov.uk", change: { label: "+£20bn", dir: "up" }, ...o }) as Metric;
  it("copies the published debt figure and counts its age in days", () => {
    const d = debtPanel([m({})], "2026-11-11");
    expect(d.value).toBe("£2,900bn");
    expect(d.ageDays).toBe(21);
    expect(d.next).toBe("2026-11-21");
  });
  it("shows no value when ONS has no figure", () => {
    const d = debtPanel([m({ value: null })], "2026-11-11");
    expect(d.value).toBeNull();
    expect(d.ageDays).toBeNull();
    expect(d.change).toBeNull();
  });
});
