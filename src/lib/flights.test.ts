import { describe, expect, it } from "vitest";
import { areaAt, buildAreas, flightStatus, parseAdsbLol, parseOpenSky, projectAhead } from "./flights";

describe("flight colours", () => {
  it("7700 is red", () => expect(flightStatus("7700", undefined).status).toBe("red"));
  it("7500 is red", () => expect(flightStatus("7500", undefined).status).toBe("red"));
  it("7600 is amber", () => expect(flightStatus("7600", undefined).status).toBe("amber"));
  it("US Level 4 country is red", () => expect(flightStatus(null, { us: 4 }).status).toBe("red"));
  it("FCDO against all travel is red", () => expect(flightStatus(null, { uk: "all" }).status).toBe("red"));
  it("US Level 3 country is amber", () => expect(flightStatus(null, { us: 3 }).status).toBe("amber"));
  it("FCDO all but essential is amber", () => expect(flightStatus(null, { uk: "all-but-essential" }).status).toBe("amber"));
  it("emergency code overrides calm advice", () => expect(flightStatus("7700", { us: 1, uk: "none" }).status).toBe("red"));
  it("radio failure stays amber even over a calm country", () => expect(flightStatus("7600", { us: 1 }).status).toBe("amber"));
  it("Level 2 with no code is green", () => expect(flightStatus("1234", { us: 2, uk: "none" }).status).toBe("green"));
});

describe("feeds", () => {
  it("OpenSky skips planes on the ground and converts units", () => {
    const p = parseOpenSky({ states: [["abc", "BAW1 ", "UK", 100, 100, -0.5, 51.5, 10000, false, 250, 90, 0, null, 10000, "7700"], ["def", "X", "UK", 1, 1, 0, 51, 0, true, 0, 0, 0, null, 0, null]] });
    expect(p).toHaveLength(1);
    expect(p[0]![4]).toBe(32808);
    expect(p[0]![7]).toBe("7700");
  });
  it("adsb.lol skips ground", () => expect(parseAdsbLol({ now: 1000, ac: [{ hex: "a", lat: 1, lon: 2, alt_baro: "ground" }, { hex: "b", lat: 1, lon: 2, alt_baro: 30000, seen_pos: 0 }] })).toHaveLength(1));
  it("line ahead heads east along track 90", () => expect(projectAhead(0, 0, 90, 111)[1]).toBeCloseTo(1, 1));
  it("finds the country under a point", () => {
    const areas = buildAreas([{ properties: { name: "Box" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] } }], (n) => n.toLowerCase());
    expect(areaAt(5, 5, areas)).toBe("box");
    expect(areaAt(20, 5, areas)).toBeNull();
  });
});
