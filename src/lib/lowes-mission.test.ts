import { describe, expect, it } from "vitest";
import { newGame, step, stageAt, JOURNEY, GROUND, score, PLAYER_X, BOSS_HP, H, BOSS_AT } from "./lowes-mission";

const near = (s: ReturnType<typeof newGame>) => ({ ...s, y: 200 });

describe("Lowe's Mission", () => {
  it("runs from Downing Street to Manchester", () => {
    expect(stageAt(0).name).toBe("10 Downing Street");
    expect(stageAt(JOURNEY).name).toBe("Manchester");
  });
  it("hitting the ground ends the run", () => {
    expect(step({ ...newGame(), y: GROUND - 5 }, 0.05, false).over).toBe(true);
  });
  it("flying into an MP smashes them instead of ending the run", () => {
    const s = step({ ...near(newGame()), flyers: [{ x: PLAYER_X, y: 200, who: "farage", vy: 0, smashed: 0 }] }, 0.001, false);
    expect(s.over).toBe(false);
    expect(s.smashed).toBe(1);
  });
  it("Burnham appears as a boss at each boss point", () => {
    const s = step({ ...near(newGame()), dist: JOURNEY * BOSS_AT[0] }, 0.01, false);
    expect(s.boss?.hp).toBe(BOSS_HP);
  });
  it("the boss takes three hits to beat", () => {
    let s = { ...near(newGame()), bossIndex: 1 } as ReturnType<typeof newGame>;
    let hp = BOSS_HP;
    const by = H / 2 - 40 + Math.sin(3.3 * 1.6) * 120; // mid-lunge position
    for (let i = 0; i < 3; i++) {
      s = step({ ...s, y: by, vy: 0, boss: { hp, x: PLAYER_X, y: by, t: 3.3, cooldown: 9, invuln: 0, enter: 0, flee: 0 } }, 0.001, false);
      if (i < 2) expect(s.boss?.hp).toBe(--hp);
    }
    expect(s.boss).toBeNull();
    expect(s.bossesBeaten).toBe(1);
    expect(s.runners).toHaveLength(1); // Burnham runs off for good
  });
  it("can't finish in Manchester while the boss is still standing", () => {
    const s = step({ ...near(newGame()), dist: JOURNEY - 1, bossIndex: 3, boss: { hp: 3, x: 700, y: 60, t: 0, cooldown: 9, invuln: 0, enter: 0, flee: 0 } }, 0.05, false);
    expect(s.won).toBe(false);
    const w = step({ ...near(newGame()), dist: JOURNEY - 1, bossIndex: 3 }, 0.05, false);
    expect(w.won).toBe(true);
  });
  it("Burnham runs away after each hit and can't be hit while fleeing", () => {
    const by = H / 2 - 40 + Math.sin(3.3 * 1.6) * 120;
    const s = step({ ...newGame(), y: by, bossIndex: 1, boss: { hp: 3, x: PLAYER_X, y: by, t: 3.3, cooldown: 9, invuln: 0, enter: 0, flee: 0 } }, 0.001, false);
    expect(s.boss?.flee).toBeGreaterThan(0);
    const later = step({ ...s, y: 200 }, 1, false);
    expect(later.boss!.x).toBeGreaterThan(PLAYER_X + 300);
    expect(later.boss!.hp).toBe(2);
  });
  it("includes Mahmood, Rayner and Khan as smashable rivals", () => {
    for (const who of ["mahmood", "rayner", "khan"] as const) {
      const s = step({ ...newGame(), y: 200, flyers: [{ x: PLAYER_X, y: 200, who, vy: 0, smashed: 0 }] }, 0.001, false);
      expect(s.smashed).toBe(1);
    }
  });
  it("scores votes 10, smashes 50, bosses 300", () => {
    expect(score({ votes: 2, smashed: 1, bossesBeaten: 1, dist: 0, won: false })).toBe(370);
  });
});
