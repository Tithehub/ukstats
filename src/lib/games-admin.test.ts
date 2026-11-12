import { describe, it, expect } from "vitest";
import { topPlayers } from "./games-admin";

describe("topPlayers", () => {
  it("ranks by total score and breaks ties with fewer plays", () => {
    const names = new Map([["a", "Ann"], ["b", "Bob"]]);
    const rows = [
      { user_id: "a", game: "g", score: 5, day: "2026-11-12" },
      { user_id: "a", game: "g", score: 5, day: "2026-11-11" },
      { user_id: "b", game: "g", score: 10, day: "2026-11-12" },
    ];
    expect(topPlayers(rows, names).map((r) => r.player)).toEqual(["Bob", "Ann"]);
  });
});
