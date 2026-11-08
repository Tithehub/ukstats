import { describe, expect, it } from "vitest";
import { SCANDALS } from "./scandals.data";
import { findScandal, matchScandal, orderedVideos, sortedHeadlines } from "./scandals";

describe("scandals", () => {
  it("every scandal has at least one official https source", () => {
    for (const s of SCANDALS) {
      expect(s.official.length).toBeGreaterThan(0);
      for (const o of s.official) expect(o.url.startsWith("https://")).toBe(true);
    }
  });
  it("slugs are unique", () => {
    expect(new Set(SCANDALS.map((s) => s.slug)).size).toBe(SCANDALS.length);
  });
  it("headlines sort newest first", () => {
    const h = sortedHeadlines([
      { outlet: "A", title: "old", url: "https://a", published: "2024-01-01" },
      { outlet: "B", title: "new", url: "https://b", published: "2026-01-01" },
    ]);
    expect(h[0]?.title).toBe("new");
  });
  it("official videos come first", () => {
    const v = orderedVideos([{ id: "a", channel: "News", title: "x" }, { id: "b", channel: "Inquiry", title: "y", official: true }]);
    expect(v[0]?.id).toBe("b");
  });
  it("finds and searches", () => {
    expect(findScandal("post-office-horizon")?.title).toBe("Post Office Horizon");
    expect(findScandal("nope")).toBeUndefined();
    expect(matchScandal(findScandal("iraq-war")!, "chilcot")).toBe(true);
    expect(matchScandal(findScandal("iraq-war")!, "savile")).toBe(false);
  });
});
