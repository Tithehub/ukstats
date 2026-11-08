import { describe, it, expect } from "vitest";
import { parseWx, wxWords } from "./weather-globe";

describe("parseWx", () => {
  it("keeps only rows with a real reading and never fills gaps", () => {
    const r = parseWx([{ current: { time: "2026-11-08T17:15", temperature_2m: 10.5, weather_code: 3, wind_speed_10m: 4.7 } }, { current: { time: "x" } }], [["London", 51.5, -0.1], ["Paris", 48.8, 2.3]]);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ name: "London", tempC: 10.5, time: "2026-11-08T17:15Z" });
  });
  it("names WMO codes", () => { expect(wxWords(95)).toBe("Thunderstorm"); expect(wxWords(73)).toBe("Snow"); });
});
