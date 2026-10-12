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

describe("parseEcccAlerts", () => {
  // Shape taken from https://api.weather.gc.ca/collections/weather-alerts/items
  const feed = {
    type: "FeatureCollection",
    features: [
      { properties: { alert_name_en: "snowfall warning", risk_colour_en: "yellow", province: "SK" } },
      { properties: { alert_name_en: "snowfall warning", risk_colour_en: "None", province: "SK" } },
      { properties: { alert_name_en: "fog advisory", risk_colour_en: "yellow", province: "QC" } },
      { properties: { alert_name_en: "storm surge warning", risk_colour_en: "red", province: "NL" } },
      { properties: { alert_name_en: "   ", risk_colour_en: "yellow", province: "ON" } },
    ],
  };

  it("counts named warnings, ranks the colour and names the most common", () => {
    const a = parseEcccAlerts(feed);
    expect(a?.count).toBe(4);
    expect(a?.worst).toBe("red");
    expect(a?.main).toEqual({ name: "snowfall warning", areas: 2 });
    expect(a?.provinces[0]).toEqual({ code: "SK", count: 2 });
  });

  it("treats 'None' as no colour rather than a warning level", () => {
    const a = parseEcccAlerts({ features: [{ properties: { alert_name_en: "special weather statement", risk_colour_en: "None", province: "MB" } }] });
    expect(a?.count).toBe(1);
    expect(a?.worst).toBeNull();
  });

  it("returns nothing when the payload is not a warning list", () => {
    expect(parseEcccAlerts({})).toBeNull();
    expect(parseEcccAlerts(null)).toBeNull();
    expect(parseEcccAlerts("[]")).toBeNull();
  });
});

describe("parseNwsAlerts", () => {
  const page = {
    type: "FeatureCollection",
    features: [
      { properties: { id: "urn:oid:2.49.0.1.840.0-KEEPALIVE-40792", event: "Test Message" } },
      { properties: { id: "https://api.weather.gov/alerts/a", event: "Flood Warning" } },
      { properties: { id: "https://api.weather.gov/alerts/b", event: "High Wind Advisory" } },
      { properties: { id: "https://api.weather.gov/alerts/c", event: "High Wind Advisory" } },
    ],
  };

  it("drops the alerting system's own test traffic", () => {
    expect(parseNwsAlerts(page)?.map((a) => a.event)).toEqual(["Flood Warning", "High Wind Advisory", "High Wind Advisory"]);
  });

  it("counts one warning covering several states once", () => {
    const shared = { features: [{ properties: { id: "https://api.weather.gov/alerts/b", event: "High Wind Advisory" } }] };
    const all = [...(parseNwsAlerts(page) ?? []), ...(parseNwsAlerts(shared) ?? [])];
    expect(all).toHaveLength(4);
    expect(dedupeAlerts(all)).toHaveLength(3);
    expect(mainWarning(dedupeAlerts(all))).toEqual({ event: "High Wind Advisory", count: 2 });
  });

  it("returns nothing when a state's page is not a warning list", () => {
    expect(parseNwsAlerts({ errors: [{ code: 400, detail: "bad area" }] })).toBeNull();
    expect(parseNwsAlerts(null)).toBeNull();
  });
});

describe("parseSdmxCsv against the ABS layout", () => {
  it("reads the published headline CPI quarter", () => {
    const csv = [
      "DATAFLOW,MEASURE,INDEX,TSEST,REGION,FREQ,TIME_PERIOD,OBS_VALUE,UNIT_MEASURE,OBS_STATUS,DECIMALS,OBS_COMMENT",
      "ABS:CPI_Q(1.0.0),3,999901,20,50,Q,2026-Q2,3.9,PCT,,,",
      "ABS:CPI_Q(1.0.0),3,999901,20,50,Q,2026-Q1,4,PCT,,,",
    ].join("\n");
    expect(parseSdmxCsv(csv)).toEqual([
      { time: "2026-Q1", value: 4 },
      { time: "2026-Q2", value: 3.9 },
    ]);
  });

  it("reads the published average weekly earnings semester", () => {
    const csv = [
      "DATAFLOW,MEASURE,ESTIMATE_TYPE,SEX,SECTOR,INDUSTRY,TSEST,REGION,FREQ,TIME_PERIOD,OBS_VALUE,UNIT_MEASURE,OBS_STATUS,OBS_COMMENT",
      "ABS:AWE(1.0.0),1,1,3,7,TOT,10,AUS,S,2026-S1,1579.2,AUD,,",
      "ABS:AWE(1.0.0),1,1,3,7,TOT,10,AUS,S,2025-S2,1562.4,AUD,,",
    ].join("\n");
    expect(parseSdmxCsv(csv)).toEqual([
      { time: "2025-S2", value: 1562.4 },
      { time: "2026-S1", value: 1579.2 },
    ]);
  });
});

