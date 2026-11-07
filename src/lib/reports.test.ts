import { describe, expect, it } from "vitest";
import { canDownload, kindsFor, REPORT_PRICES, savingPercent } from "./reports";

const now = new Date("2026-11-07T12:00:00Z");

describe("report prices", () => {
  it("daily UK report is £1 and Global is £2.50", () => {
    expect(REPORT_PRICES.report_uk_daily.pence).toBe(100);
    expect(REPORT_PRICES.report_global_daily.pence).toBe(250);
  });
  it("subscriptions are cheaper than buying every day", () => {
    for (const id of ["report_uk_monthly", "report_uk_yearly", "report_global_monthly", "report_global_yearly"] as const)
      expect(savingPercent(id)).toBeGreaterThan(0);
  });
});

describe("report access", () => {
  it("a single-day purchase unlocks only that day", () => {
    const p = [{ edition: "uk" as const, report_date: "2026-11-07" }];
    expect(canDownload({ edition: "uk", kind: "daily", date: "2026-11-07" }, p, [], now)).toBe(true);
    expect(canDownload({ edition: "uk", kind: "daily", date: "2026-11-06" }, p, [], now)).toBe(false);
    expect(canDownload({ edition: "global", kind: "daily", date: "2026-11-07" }, p, [], now)).toBe(false);
    expect(canDownload({ edition: "uk", kind: "weekly", date: "2026-11-07" }, p, [], now)).toBe(false);
  });
  it("a Global daily purchase includes the UK report for that day", () => {
    const p = [{ edition: "global" as const, report_date: "2026-11-07" }];
    expect(canDownload({ edition: "uk", kind: "daily", date: "2026-11-07" }, p, [], now)).toBe(true);
  });
  it("subscribers keep access until the paid period ends, even after cancelling", () => {
    const sub = { edition: "uk" as const, status: "canceled", current_period_start: null, current_period_end: "2026-11-30T00:00:00Z" };
    expect(canDownload({ edition: "uk", kind: "monthly", date: "2026-11-01" }, [], [sub], now)).toBe(true);
    expect(canDownload({ edition: "uk", kind: "daily", date: "2026-11-07" }, [], [sub], new Date("2026-12-01"))).toBe(false);
    expect(canDownload({ edition: "global", kind: "daily", date: "2026-11-07" }, [], [sub], now)).toBe(false);
  });
});

describe("schedule", () => {
  it("weekly on Mondays and monthly on the 1st", () => {
    expect(kindsFor("2026-11-02")).toEqual(["daily", "weekly"]);
    expect(kindsFor("2026-12-01")).toEqual(["daily", "monthly"]);
    expect(kindsFor("2026-11-07")).toEqual(["daily"]);
  });
});
