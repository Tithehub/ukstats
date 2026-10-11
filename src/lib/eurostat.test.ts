import { describe, expect, it } from "vitest";
import { parseByGeo } from "./eurostat";
import { countryByCode } from "./countries";

describe("eurostat parser", () => {
  it("skips missing cells instead of inventing values", () => {
    const g = parseByGeo({
      id: ["unit", "geo", "time"], size: [1, 2, 2], value: { "0": 1.5, "3": 2.5 },
      dimension: { unit: { category: { index: { X: 0 } } }, geo: { category: { index: { FR: 0, DE: 1 } } }, time: { category: { index: { "2025": 0, "2026": 1 } } } },
    });
    expect(g["FR"]?.points).toEqual([{ time: "2025", value: 1.5 }]);
    expect(g["DE"]?.points).toEqual([{ time: "2026", value: 2.5 }]);
  });
  it("refuses datasets not filtered to one series", () => {
    expect(parseByGeo({ id: ["unit", "geo", "time"], size: [2, 1, 1], value: { "0": 1 }, dimension: { unit: { category: { index: { A: 0, B: 1 } } }, geo: { category: { index: { FR: 0 } } }, time: { category: { index: { "2026": 0 } } } } })).toEqual({});
  });
  it("maps Greece to Eurostat code EL and rejects unknown codes", () => {
    expect(countryByCode("gr")?.eurostat).toBe("EL");
    expect(countryByCode("zz")).toBeUndefined();
  });
});

import { yoyFromIndex, parseSdmxCsv } from "./national";
describe("national parsers", () => {
  it("only computes a 12-month change when the same month a year earlier is published", () => {
    expect(yoyFromIndex([{ time: "2025-08", value: 100 }, { time: "2026-07", value: 103 }, { time: "2026-08", value: 102.5 }])).toEqual([{ time: "2026-08", value: 2.5 }]);
  });
  it("skips blank SDMX values", () => {
    expect(parseSdmxCsv("A,TIME_PERIOD,OBS_VALUE\nx,2026-01,4.1\nx,2026-02,")).toEqual([{ time: "2026-01", value: 4.1 }]);
  });
});
