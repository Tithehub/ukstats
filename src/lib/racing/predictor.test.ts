import { describe, it, expect } from "vitest";
import { predictRace, formScore } from "./predictor";
import type { RaceRow, RunnerRow } from "./racing.functions";

const run = (id: string, o: Partial<RunnerRow> = {}): RunnerRow => ({ id, cloth_number: Number(id), draw: null, age: 5, weight_lbs: 140, official_rating: null, form: null, headgear: null, non_runner: false, horse: { id: "h" + id, name: "H" + id, sex: null }, trainer: null, jockey: null, ...o });
const race = (runners: RunnerRow[]): RaceRow => ({ id: "r", off_time: "2026-11-09T13:00:00Z", name: "Test", race_type: null, distance_yards: null, class: null, prize_gbp: null, going: null, field_size: null, status: "scheduled", runners });

describe("racing predictor", () => {
  it("excludes non-runners from the ranking", () => {
    const p = predictRace(race([run("1", { form: "111" }), run("2", { form: "222" }), run("3", { form: "111", non_runner: true })]));
    expect(p.ok && p.ranked.map((r) => r.runner.id)).toEqual(["1", "2"]);
    expect(p.nonRunners.map((r) => r.id)).toEqual(["3"]);
  });
  it("gives tied runners the same rank", () => {
    const p = predictRace(race([run("1", { form: "21" }), run("2", { form: "21" }), run("3", { form: "00" })]));
    expect(p.ok && p.ranked.map((r) => r.rank)).toEqual([1, 1, 3]);
  });
  it("refuses to predict when most runners have no form or rating", () => {
    const p = predictRace(race([run("1", { form: "1" }), run("2"), run("3")]));
    expect(p.ok).toBe(false);
  });
  it("weights the most recent run highest", () => {
    expect(formScore("01")!).toBeGreaterThan(formScore("10")!);
  });
});
