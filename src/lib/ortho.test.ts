import { describe, expect, it } from "vitest";
import { invert, project, inRing } from "./ortho";

const v = { lng: -2, lat: 54, r: 300 };
describe("orthographic projection", () => {
  it("puts the view centre in the middle, facing the viewer", () => {
    const p = project(-2, 54, v);
    expect(Math.abs(p.x)).toBeLessThan(1e-9); expect(Math.abs(p.y)).toBeLessThan(1e-9); expect(p.z).toBeCloseTo(1);
  });
  it("hides the far side of the Earth", () => { expect(project(178, -54, v).z).toBeLessThan(0); });
  it("inverts back to the same place", () => {
    const p = project(10, 40, v); const q = invert(p.x, p.y, v)!;
    expect(q.lng).toBeCloseTo(10); expect(q.lat).toBeCloseTo(40);
  });
  it("north is up on screen", () => { expect(project(-2, 60, v).y).toBeLessThan(0); });
  it("point in polygon", () => { const sq = [[0, 0], [10, 0], [10, 10], [0, 10]]; expect(inRing(5, 5, sq)).toBe(true); expect(inRing(15, 5, sq)).toBe(false); });
});
