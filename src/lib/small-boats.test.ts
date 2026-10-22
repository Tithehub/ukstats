import { describe, expect, it } from "vitest";
import { parseSmallBoatsXml, pmTotals, type BoatDay } from "./small-boats";

const cell = (v: number) => `<table:table-cell office:value-type="float" office:value="${v}" table:style-name="x"><text:p>${v}</text:p></table:table-cell>`;
const row = (date: string, a: number, b: number) =>
  `<table:table-row><table:table-cell office:value-type="date" office:date-value="${date}T00:00:00"><text:p>x</text:p></table:table-cell>${cell(a)}${cell(b)}</table:table-row>`;
const wrap = (rows: string) => `<table:table table:name="SB_01">${rows}</table:table>`;

describe("small boats daily series", () => {
  it("reads every day's arrivals and boats", () => {
    expect(parseSmallBoatsXml(wrap(row("2024-07-04", 10, 1) + row("2024-07-05", 20, 2)))).toEqual([
      { date: "2024-07-04", arrivals: 10, boats: 1 },
      { date: "2024-07-05", arrivals: 20, boats: 2 },
    ]);
  });
  it("refuses the series when a day is missing", () => {
    expect(() => parseSmallBoatsXml(wrap(row("2024-07-04", 10, 1) + row("2024-07-06", 20, 2)))).toThrow(/Gap/);
  });
  it("gives the handover day to the incoming Prime Minister", () => {
    const s: BoatDay[] = [
      { date: "2024-07-04", arrivals: 10, boats: 1 },
      { date: "2024-07-05", arrivals: 20, boats: 2 },
    ];
    const rows = pmTotals(s);
    expect(rows.find((r) => r.name === "Rishi Sunak")?.arrivals).toBe(10);
    expect(rows.find((r) => r.name === "Keir Starmer")?.arrivals).toBe(20);
  });
});

import { compareLatest, mergeRecent, parseLast7DaysHtml } from "./small-boats";

describe("last 7 days merge", () => {
  const html = "<table><tr><th>Date</th><th>Migrants</th><th>Boats</th></tr><tr><td>16 October 2026</td><td>1,200</td><td>3</td></tr><tr><td>17 October 2026</td><td>0</td><td>0</td></tr><tr><td>15 October 2026</td><td>9</td><td>9</td></tr></table>";
  it("parses GOV.UK dates and figures in date order", () => {
    expect(parseLast7DaysHtml(html)).toEqual([
      { date: "2026-10-15", arrivals: 9, boats: 9 },
      { date: "2026-10-16", arrivals: 1200, boats: 3 },
      { date: "2026-10-17", arrivals: 0, boats: 0 },
    ]);
  });
  it("rejects a row with no figure", () => {
    expect(() => parseLast7DaysHtml("<tr><td>1 October 2026</td><td>-</td><td>0</td></tr>")).toThrow();
  });
  it("keeps the time series figure on overlapping days and flags only new days", () => {
    const merged = mergeRecent([{ date: "2026-10-15", arrivals: 5, boats: 1 }], parseLast7DaysHtml(html));
    expect(merged.map((d) => [d.date, d.arrivals, !!d.provisional])).toEqual([
      ["2026-10-15", 5, false], ["2026-10-16", 1200, true], ["2026-10-17", 0, true],
    ]);
  });
  it("adds nothing when the recent days leave a gap", () => {
    const merged = mergeRecent([{ date: "2026-10-10", arrivals: 5, boats: 1 }], parseLast7DaysHtml(html));
    expect(merged).toHaveLength(1);
  });
});

describe("compareLatest", () => {
  const days = (from: string, n: number, v: number) => Array.from({ length: n }, (_, i) => ({ date: new Date(Date.parse(from + "T00:00:00Z") + i * 86_400_000).toISOString().slice(0, 10), arrivals: v, boats: 1 }));
  it("averages the 7 and 30 days before the latest day and the same week last year", () => {
    const s = [...days("2025-10-01", 30, 10), ...days("2025-10-31", 365 - 30, 2), ...days("2026-09-01", 50, 4)];
    const c = compareLatest(s)!;
    expect(c.latest.date).toBe("2026-10-20");
    expect(c.avg7).toBe(4);
    expect(c.avg30).toBe(4);
    expect(c.last7).toBe(28);
    expect(c.sameWeekFrom).toBe("2025-10-14");
    expect(c.sameWeekLastYear).toBe(70);
  });
  it("returns null averages when days are missing", () => {
    const c = compareLatest(days("2026-10-18", 3, 1))!;
    expect(c.avg7).toBeNull();
    expect(c.sameWeekLastYear).toBeNull();
  });
});
