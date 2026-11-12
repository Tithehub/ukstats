import { describe, expect, it } from "vitest";
import { newGame, step, stageAt, JOURNEY, GROUND, score, FLAP } from "./burnhams-dash";

describe("Burnham's Dash", () => {
  it("starts at Downing Street and ends in Manchester", () => {
    expect(stageAt(0).name).toBe("10 Downing Street");
    expect(stageAt(JOURNEY).name).toBe("Manchester");
  });
  it("gravity pulls the player down and a flap sends him up", () => {
    const g = newGame();
    expect(step(g, 0.1, false).y).toBeGreaterThan(g.y);
    expect(step(g, 0.01, true).vy).toBeLessThan(0);
    expect(step(g, 0.01, true).vy).toBeGreaterThan(FLAP - 1);
  });
  it("hitting the ground ends the run", () => {
    const s = step({ ...newGame(), y: GROUND - 5 }, 0.05, false);
    expect(s.over).toBe(true);
    expect(s.won).toBe(false);
  });
  it("reaching Manchester wins with a bonus", () => {
    const s = step({ ...newGame(), dist: JOURNEY - 1 }, 0.05, false);
    expect(s.won).toBe(true);
    expect(score({ coins: 0, dist: JOURNEY, won: true })).toBe(740);
  });
  it("coins are worth 10 points each", () => {
    expect(score({ coins: 3, dist: 0, won: false })).toBe(30);
  });
});
