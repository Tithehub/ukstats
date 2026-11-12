import { describe, expect, it } from "vitest";
import { stripItems } from "./game-stats-strip";
import type { Metric } from "./uk-stats";

const m = (id: string, value: string | null) => ({ id, value, period: "Oct 2026", source: "ONS" }) as Metric;

describe("game stats strip", () => {
  it("shows only the five chosen figures", () => {
    const items = stripItems([m("uk-national-debt", "£3,005bn"), m("uk-house-prices", "£290k")]);
    expect(items.map((i) => i.key)).toEqual(["uk-small-boats-daily", "uk-irregular-migration", "uk-national-debt", "uk-foreign-aid", "tax-welfare"]);
    expect(items[2]!.value).toBe("£3,005bn");
  });
  it("missing figures say Not published", () => {
    const items = stripItems([]);
    expect(items.every((i) => i.value === "Not published")).toBe(true);
  });
  it("tax vs welfare uses the latest complete year, side by side", () => {
    const items = stripItems([], [{ year: "2025", receipts: 1, incomeTax: 300000, welfare: 320000 }, { year: "2026", receipts: 1, incomeTax: 100, welfare: 100, partial: true }]);
    expect(items[4]!.value).toBe("£300bn vs £320bn");
  });
});
