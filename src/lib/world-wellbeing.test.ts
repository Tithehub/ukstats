import { describe, expect, it } from "vitest";
import { markRanked, rankCountries, parseEurostatLifeSat } from "./world-wellbeing";

describe("world wellbeing", () => {
  it("leaves figures more than 3 years behind the newest unranked", () => {
    const r = markRanked([{ id: "A", name: "A", score: 7, year: 2024, ranked: false }, { id: "B", name: "B", score: 8, year: 2018, ranked: false }]);
    expect(r.find((x) => x.id === "B")!.ranked).toBe(false);
    expect(rankCountries(r, true).map((x) => x.id)).toEqual(["A"]);
  });
  it("ties share a position", () => {
    const rows = markRanked(["A", "B", "C"].map((id, i) => ({ id, name: id, score: i < 2 ? 7 : 6, year: 2024, ranked: false })));
    expect(rankCountries(rows, true).map((x) => x.position)).toEqual([1, 1, 3]);
  });
  it("missing Eurostat cells stay null and aggregates are dropped", () => {
    const js = { id: ["geo", "time"], size: [3, 1], value: { "1": 7.2 }, dimension: { geo: { category: { index: { EU27_2020: 0, BE: 1, UK: 2 }, label: { BE: "Belgium", UK: "United Kingdom" } } }, time: { category: { index: { "2023": 0 } } } } };
    const r = parseEurostatLifeSat(js as never);
    expect(r.map((x) => x.id)).toEqual(["BE", "UK"]);
    expect(r.find((x) => x.id === "UK")!.score).toBeNull();
  });
});
