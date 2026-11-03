import { describe, expect, it } from "vitest";
import { MAX_SCREENS, MIN_H, MIN_W, canAdd, clampScreen, newScreen, parseStored, tidy, type NewsScreen } from "./news-screens";

const mk = (n: number): NewsScreen[] => Array.from({ length: n }, (_, i) => ({ id: `s${i}`, country: "united kingdom", x: 0, y: 0, w: 300, h: 300, min: false, z: i }));

describe("news screens", () => {
  it("allows at most 6 screens", () => {
    expect(MAX_SCREENS).toBe(6);
    expect(canAdd(mk(5))).toBe(true);
    expect(canAdd(mk(6))).toBe(false);
  });
  it("never shrinks below 280×220", () => {
    const s = clampScreen({ x: 0, y: 0, w: 50, h: 50 }, 1000, 800);
    expect([s.w, s.h]).toEqual([MIN_W, MIN_H]);
  });
  it("keeps screens inside the globe area", () => {
    const s = clampScreen({ x: 900, y: -40, w: 300, h: 300 }, 1000, 800);
    expect(s.x).toBe(700);
    expect(s.y).toBe(0);
  });
  it("puts a new screen on top", () => {
    expect(newScreen(mk(3), "france", 1200, 800, "n").z).toBe(3);
  });
  it("tidy lays screens out without overlap", () => {
    const t = tidy(mk(4), 1200, 800);
    for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) {
      const a = t[i]!, b = t[j]!;
      expect(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y).toBe(true);
    }
  });
  it("ignores corrupt stored data", () => {
    expect(parseStored("nope")).toEqual([]);
    expect(parseStored(JSON.stringify([{ id: "a" }]))).toEqual([]);
  });
});
