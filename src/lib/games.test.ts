import { describe, expect, it } from "vitest";
import { guessPoints, scoreQuestion, rankOrder, type Fact, type Question } from "./games";
import { WORLD_INDICATORS } from "./world";
const ind = WORLD_INDICATORS[0]!;
const f = (iso3: string, value: number): Fact => ({ iso3, iso2: "", name: iso3, value, year: 2024 });

describe("game scoring", () => {
  it("guess: exact 100, within 1% 90, 5% 75, 10% 50, 25% 25, else 0", () => {
    expect(guessPoints(1000, 1000)).toBe(100);
    expect(guessPoints(1009, 1000)).toBe(90);
    expect(guessPoints(1040, 1000)).toBe(75);
    expect(guessPoints(900, 1000)).toBe(50);
    expect(guessPoints(800, 1000)).toBe(25);
    expect(guessPoints(500, 1000)).toBe(0);
  });
  it("higher or lower: correct pick 100, wrong 0", () => {
    const q: Question = { kind: "hl", ind, a: f("A", 5), b: f("B", 9) };
    expect(scoreQuestion(q, 1)).toBe(100);
    expect(scoreQuestion(q, 0)).toBe(0);
  });
  it("rank: 20 points per correct position", () => {
    const items = [f("A", 1), f("B", 5), f("C", 3), f("D", 4), f("E", 2)];
    const q: Question = { kind: "rank", ind, items };
    expect(rankOrder(items)).toEqual(["B", "D", "C", "E", "A"]);
    expect(scoreQuestion(q, ["B", "D", "C", "E", "A"])).toBe(100);
    expect(scoreQuestion(q, ["B", "D", "A", "E", "C"])).toBe(60);
  });
});
