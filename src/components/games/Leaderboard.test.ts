import { describe, expect, it } from "vitest";
import { BOARD_IDS } from "./Leaderboard";
describe("leaderboard picker", () => {
  it("offers Overall first, then all six games including Guess the Flag", () => {
    expect(BOARD_IDS[0]).toBe("overall");
    expect([...BOARD_IDS].sort()).toEqual(["britain-by-the-numbers", "daily-5", "guess-the-flag", "guess-the-number", "higher-or-lower", "overall", "rank-the-world"]);
  });
});
