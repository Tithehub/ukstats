// Wave 2 national parsers: every one of them must return nothing rather than a
// guessed figure when the publisher's payload is missing, blank or malformed.
import { describe, expect, it } from "vitest";
import { dedupeAlerts, mainWarning, noFeed, parseBls, parseEcccAlerts, parseNwsAlerts, parseSdmxCsv, parseStatCan, yoyFromIndex } from "./national";

describe("yoyFromIndex", () => {
  it("only compares a month with the same month a year earlier", () => {
    const pts = [
      { time: "2024-03", value: 100 },
      { time: "2025-01", value: 120 },
      { time: "2025-03", value: 110 },
    ];
    expect(yoyFromIndex(pts)).toEqual([{ time: "2025-03", value: 10 }]);
  });

  it("returns nothing when no year-earlier month is published", () => {
    expect(yoyFromIndex([{ time: "2025-06", value: 100 }])).toEqual([]);
  });
});

describe("parseBls", () => {
  it("keeps monthly periods only, drops blanks and sorts by month", () => {
    const js = {
      Results: {
        series: [
          {
            data: [
              { year: "2025", period: "M12", value: "3.8" },
              { year: "2025", period: "M06", value: "3.5" },
              { year: "2025", period: "M13", value: "9.9" },
              { year: "2025", period: "M07", value: "-" },
              { year: "2025", period: "S01", value: "4.1" },
            ],
          },
        ],
      },
    };
    expect(parseBls(js)).toEqual([
      { time: "2025-06", value: 3.5 },
      { time: "2025-12", value: 3.8 },
    ]);
  });

  it("returns nothing for a payload with no series", () => {
    expect(parseBls({ Results: { series: [] } })).toEqual([]);
    expect(parseBls(null)).toEqual([]);
  });
});

describe("parseStatCan", () => {
  it("reads only the requested vector and skips missing values", () => {
    const js = [
      {
        object: {
          vectorId: 10,
          vectorDataPoint: [
            { refPer: "2025-03-01", value: 1.5 },
            { refPer: "2025-04-01", value: null },
          ],
        },
      },
      { object: { vectorId: 20, vectorDataPoint: [{ refPer: "2025-03-01", value: 99 }] } },
    ];
    expect(parseStatCan(js, 10)).toEqual([{ time: "2025-03", value: 1.5 }]);
    expect(parseStatCan(js, 999)).toEqual([]);
  });
});

describe("parseSdmxCsv", () => {
  it("parses TIME_PERIOD and OBS_VALUE and sorts them", () => {
    const csv = "FREQ,TIME_PERIOD,OBS_VALUE\nA,2025-06,2.1\nA,2025-01,1.9\nA,2025-03,\n";
    expect(parseSdmxCsv(csv)).toEqual([
      { time: "2025-01", value: 1.9 },
      { time: "2025-06", value: 2.1 },
    ]);
  });

  it("returns nothing when the expected columns are absent", () => {
    expect(parseSdmxCsv("FREQ,DATE,VALUE\nA,2025-01,1.9\n")).toEqual([]);
  });
});

describe("noFeed", () => {
  it("states the gap instead of a figure", () => {
    const m = noFeed("au-cpi", "Inflation", "ABS", "https://www.abs.gov.au", "No machine-readable feed");
    expect(m.status).toBe("no-feed");
    expect(m.value).toBeNull();
    expect(m.period).toBeNull();
    expect(m.sourceUrl).toBe("https://www.abs.gov.au");
  });
});
