import { describe, expect, it } from "vitest";
import { parseQuakes } from "./quakes";
import { parseTle } from "./satellites";

describe("parseQuakes", () => {
  it("keeps valid quakes, largest first, and drops ones without a magnitude", () => {
    const q = parseQuakes({ features: [
      { id: "a", properties: { mag: 3.1, place: "X", time: 0 }, geometry: { coordinates: [10, 20, 5] } },
      { id: "b", properties: { mag: 6.2, place: "Y", time: 0, tsunami: 1 }, geometry: { coordinates: [1, 2, 30] } },
      { id: "c", properties: { mag: null, time: 0 }, geometry: { coordinates: [1, 2] } },
    ] });
    expect(q.map((x) => x.id)).toEqual(["b", "a"]);
    expect(q[0]!.tsunami).toBe(true);
  });
});

describe("parseTle", () => {
  const t = "ISS\n1 25544U 98067A   26312.17541007  .00012511  00000+0  23266-3 0  9990\n2 25544  51.6320 307.5621 0007219   1.6306 358.4705 15.49256954594075";
  it("accepts the matching catalogue number only", () => {
    expect(parseTle(t, 25544, "ISS")?.id).toBe(25544);
    expect(parseTle(t, 20580, "Hubble")).toBeNull();
  });
});
