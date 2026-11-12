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

describe("game registry", () => {
  it("every scored game is registered, Britain has 10 questions", async () => {
    const { GAME_DEFS, isGameId } = await import("./games");
    expect(Object.keys(GAME_DEFS).sort()).toEqual(["britain-by-the-numbers", "daily-5", "guess-the-number", "higher-or-lower", "rank-the-world"]);
    expect(GAME_DEFS["britain-by-the-numbers"].kinds.length).toBe(10);
    expect(isGameId("made-up")).toBe(false);
  });
});

describe("Britain by the Numbers", () => {
  it("builds 10 council questions from published figures only and scores them", async () => {
    const { britainRound, scoreRound } = await import("./games");
    const places = Array.from({ length: 30 }, (_, i) => ({ code: `E0${i}`, name: `Council ${i}`, nation: "England" as const, wellbeing: { lifeSatisfaction: 7 + i / 100, happiness: null, worthwhile: null, anxiety: null }, crimeRate: 50 + i, housePrice: 200000 + i * 1000, weeklyPay: 600 + i, over65Share: 15 + i / 10, goodSchoolsShare: null }));
    const src = { name: "ONS", url: "https://www.ons.gov.uk", period: "2025" };
    const qs = britainRound({ fetchedAt: "", places, sources: { wellbeing: src, crime: src, housePrice: src, pay: src, population: src, schools: src }, errors: [] }, "x");
    expect(qs.length).toBe(10);
    expect(qs.every((q) => q.src?.url === "https://www.ons.gov.uk")).toBe(true);
    expect(scoreRound(qs, britainRound({ fetchedAt: "", places, sources: { wellbeing: src, crime: src, housePrice: src, pay: src, population: src, schools: src }, errors: [] }, "x").map(() => null))).toBe(0);
  });
});
