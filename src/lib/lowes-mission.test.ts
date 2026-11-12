import { describe, expect, it } from "vitest";
import { newGame, step, stageAt, JOURNEY, GROUND, score, PLAYER_X, BOSS_HP, H, BOSS_AT, type State } from "./lowes-mission";

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
    const s = step({ ...near(newGame()), flyers: [{ x: PLAYER_X, y: 200, who: "polanski", vy: 0, smashed: 0 }] }, 0.001, false);
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
    for (const who of ["mahmood", "rayner", "khan", "polanski", "badenoch"] as const) {
      const s = step({ ...newGame(), y: 200, flyers: [{ x: PLAYER_X, y: 200, who, vy: 0, smashed: 0 }] }, 0.001, false);
      expect(s.smashed).toBe(1);
    }
  });
  it("scores votes 10, smashes 50, bosses 300", () => {
    expect(score({ votes: 2, smashed: 1, bossesBeaten: 1, dist: 0, won: false })).toBe(370);
  });
});

import { LEVELS, maxPlausibleScore, PUNCH_COOLDOWN, COL_W as CW, GROUND as G } from "./lowes-mission";
describe("levels, poppies and power punch", () => {
  it("Burnham takes 2 hits on Easy, 3 on Normal, 4 on Hard", () => {
    expect([LEVELS.easy.bossHp, LEVELS.normal.bossHp, LEVELS.hard.bossHp]).toEqual([2, 3, 4]);
  });
  it("Hard is faster than Normal, Easy slower", () => {
    const d = (lv: "easy" | "normal" | "hard") => step({ ...newGame(1, lv), y: 200 }, 0.01, false).dist;
    expect(d("easy")).toBeLessThan(d("normal")); expect(d("hard")).toBeGreaterThan(d("normal"));
  });
  it("poppies are worth 25, votes 10", () => {
    expect(score({ votes: 1, poppies: 1, smashed: 0, bossesBeaten: 0, dist: 0, won: false })).toBe(35);
    const s = step({ ...newGame(), y: 200, voteList: [{ x: PLAYER_X, y: 200, taken: false, poppy: true }] }, 0.001, false);
    expect(s.poppies).toBe(1); expect(s.votes).toBe(0);
  });
  it("a power punch smashes through a scandal column instead of ending the run", () => {
    const col = { x: PLAYER_X + 10, gapY: 0, gap: 10, headline: "X" };
    const s = step({ ...newGame(), y: 200, columns: [col] }, 0.001, false, true);
    expect(s.over).toBe(false); expect(s.columns).toHaveLength(0); expect(s.power).toBe(1);
    expect(s.punchCd).toBeCloseTo(PUNCH_COOLDOWN, 2);
    const again = step({ ...s, columns: [col] }, 0.001, false, true);
    expect(again.over).toBe(true); // still recharging
    void CW; void G;
  });
  it("rejects impossible scores", () => {
    expect(maxPlausibleScore("normal", 0)).toBeLessThan(2000);
    expect(maxPlausibleScore("normal", 120)).toBeGreaterThan(5000);
  });
});

describe("red tape", () => {
  const fight = (bossIndex: number) => {
    let s: State = { ...newGame(), y: 200, bossIndex, boss: { hp: 3, x: 670, y: 200, t: 0, cooldown: 0, invuln: 0, enter: 0, flee: 0 } };
    for (let i = 0; i < 5; i++) s = { ...step(s, 0.01, false), y: 200, vy: 0 };
    return s.tapes.length;
  };
  it("Birdman never throws anything", () => { expect(fight(1)).toBe(0); expect(fight(2)).toBe(0); expect(fight(3)).toBe(0); });
  it("only MASTERMIND throws red tape", () => {
    let s: State = { ...newGame(), y: 200, bossIndex: 3, boss: { hp: 3, x: 670, y: 200, t: 0, cooldown: 0, invuln: 0, enter: 0, flee: 0, mastermind: true } };
    for (let i = 0; i < 5; i++) s = { ...step(s, 0.01, false), y: 200, vy: 0 };
    expect(s.tapes.length).toBeGreaterThan(0);
  });
});

import { RIVALS, RIVAL_NAMES } from "./lowes-mission";
describe("cast", () => {
  it("Farage is out; nicknames are used", () => {
    expect(RIVALS).not.toContain("farage" as never);
    expect(RIVAL_NAMES.polanski).toBe("ZACK BOOBANSKI");
    expect(RIVAL_NAMES.khan).toBe("SADIQ CAN'T");
  });
  const beat = (bossIndex: number, mastermind = false) => {
    const by = H / 2 - 40 + Math.sin(3.3 * 1.6) * 120;
    return step({ ...newGame(), y: by, bossIndex, boss: { hp: 1, x: PLAYER_X, y: by, t: 3.3, cooldown: 9, invuln: 0, enter: 0, flee: 0, mastermind } }, 0.001, false);
  };
  it("MASTERMIND appears only after Birdman's third defeat", () => {
    expect(beat(1).boss).toBeNull();
    expect(beat(3).boss?.mastermind).toBe(true);
    const done = beat(3, true);
    expect(done.boss).toBeNull(); expect(done.bossesBeaten).toBe(1);
  });
});

import { shouldReplace } from "./arcade.functions";
describe("arcade best per day", () => {
  it("only a higher run replaces today's best", () => {
    expect(shouldReplace(null, 5)).toBe(true);
    expect(shouldReplace(692, 912)).toBe(true);
    expect(shouldReplace(692, 692)).toBe(false);
    expect(shouldReplace(692, 100)).toBe(false);
  });
});
