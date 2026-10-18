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
