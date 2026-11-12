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
  it("rank: picking the highest (or lowest) of four scores 100, else 0", () => {
    const items = [f("A", 1), f("B", 5), f("C", 3), f("D", 4)];
    expect(scoreQuestion({ kind: "rank", ind, items, dir: "high" }, 1)).toBe(100);
    expect(scoreQuestion({ kind: "rank", ind, items, dir: "high" }, 3)).toBe(0);
    expect(scoreQuestion({ kind: "rank", ind, items, dir: "low" }, 0)).toBe(100);
  });
  it("guess: only the real figure scores 100", () => {
    const q: Question = { kind: "guess", ind, a: f("A", 7), choices: [f("B", 3), f("A", 7), f("C", 9), f("D", 1)] };
    expect(scoreQuestion(q, 1)).toBe(100);
    expect(scoreQuestion(q, 0)).toBe(0);
  });
});

describe("game registry", () => {
  it("every scored game is registered, Britain has 10 questions", async () => {
    const { GAME_DEFS, isGameId } = await import("./games");
    expect(Object.keys(GAME_DEFS).sort()).toEqual(["britain-by-the-numbers", "daily-5", "english-history", "guess-the-flag", "guess-the-number", "higher-or-lower", "rank-the-world", "world-knowledge"]);
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

import { flagRound as _flagRound, scoreQuestion as _score } from "./games";
describe("Guess the Flag", () => {
  const countries = Array.from({ length: 12 }, (_, i) => ({ iso3: `C${String.fromCharCode(65 + i)}X`, iso2: `A${String.fromCharCode(65 + i)}`, name: `Country ${i}`, region: "", income: "", capital: "" }));
  const p = { countries, values: { "SP.POP.TOTL": Object.fromEntries(countries.map((c, i) => [c.iso3, { value: 2_000_000 + i, year: 2024 }])) }, updated: {}, fetchedAt: "" } as never;
  it("builds the same 10 questions from the same seed, each with 4 choices including the answer", () => {
    const a = _flagRound(p, "s1"); const b = _flagRound(p, "s1");
    expect(a).toEqual(b); expect(a).toHaveLength(10);
    for (const q of a) { if (q.kind !== "flag") throw 0; expect(q.choices).toHaveLength(4); expect(q.choices.some((c) => c.iso3 === q.a.iso3)).toBe(true); }
  });
  it("scores 100 only for the right country", () => {
    const q = _flagRound(p, "s2")[0]!; if (q.kind !== "flag") throw 0;
    const right = q.choices.findIndex((c) => c.iso3 === q.a.iso3);
    expect(_score(q, right)).toBe(100); expect(_score(q, (right + 1) % 4)).toBe(0);
  });
});

describe("knowledge quizzes", () => {
  it("every question has four distinct options and a reference", async () => {
    const { ENGLISH_HISTORY, WORLD_KNOWLEDGE } = await import("./quiz.data");
    for (const row of [...ENGLISH_HISTORY, ...WORLD_KNOWLEDGE]) {
      expect(new Set(row.slice(1, 5)).size, row[0]).toBe(4);
      expect(row[5].length && row[6].length).toBeTruthy();
    }
    expect(new Set(ENGLISH_HISTORY.map((r) => r[0])).size).toBe(ENGLISH_HISTORY.length);
    expect(new Set(WORLD_KNOWLEDGE.map((r) => r[0])).size).toBe(WORLD_KNOWLEDGE.length);
  });
  it("same seed gives the same 10 unique questions, correct option scores 100", async () => {
    const { quizRound } = await import("./games");
    const a = quizRound("english-history", "x"), b = quizRound("english-history", "x");
    expect(a).toEqual(b); expect(a.length).toBe(10);
    const q = a[0]!; if (q.kind !== "quiz") throw new Error();
    expect(new Set(a.map((x) => x.kind === "quiz" && x.q)).size).toBe(10);
    expect(scoreQuestion(q, q.answer)).toBe(100); expect(scoreQuestion(q, (q.answer + 1) % 4)).toBe(0);
  });
});
