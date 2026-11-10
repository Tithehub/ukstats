import { describe, expect, it } from "vitest";
import { itemForSpoken } from "./stream-sync";
import type { Segment } from "./stream-rundown";

const seg = { cards: [{ title: "Debt" }, { title: "Boats" }], headlines: [{ text: "H1" }] } as unknown as Segment;
const reads = ["read debt", "read boats", "read h1"];

describe("itemForSpoken", () => {
  it("shows the card the presenter is reading, not the clock's card", () => {
    expect(itemForSpoken(seg, reads, "read debt", 1)).toEqual({ kind: "card", index: 0 });
  });
  it("shows the headline when she reads a headline", () => {
    expect(itemForSpoken(seg, reads, "read h1", 0)).toEqual({ kind: "head", index: 0 });
  });
  it("falls back to the clock step for a line from another segment", () => {
    expect(itemForSpoken(seg, reads, "old line", 3)).toEqual({ kind: "card", index: 1 });
  });
});
