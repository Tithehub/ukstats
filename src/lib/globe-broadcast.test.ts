import { describe, expect, it } from "vitest";
import { buildRunningOrder, buildSegments, nextInOrder } from "./globe-broadcast";

describe("globe broadcast", () => {
  it("puts the UK first, then warned countries newest first, then the rest", () => {
    const order = buildRunningOrder(["albania", "france", "united kingdom", "italy"], [
      { key: "france", updated: "2026-11-01T00:00:00Z" },
      { key: "italy", updated: "2026-11-02T00:00:00Z" },
    ]);
    expect(order).toEqual(["united kingdom", "italy", "france", "albania"]);
  });
  it("skips empty segments but always keeps warnings", () => {
    expect(buildSegments({ hasStats: false, warningCount: 0, videoCount: 0 })).toEqual(["warnings"]);
    expect(buildSegments({ hasStats: true, warningCount: 1, videoCount: 3 })).toEqual(["stats", "warnings", "news"]);
  });
  it("a chosen country carries on to the next one in the list", () => {
    const order = ["united kingdom", "italy", "france"];
    expect(nextInOrder(order, "italy")).toBe("france");
    expect(nextInOrder(order, "france")).toBe("united kingdom");
    expect(nextInOrder(order, "narnia")).toBe("united kingdom");
    expect(nextInOrder(order, "united kingdom", -1)).toBe("france");
  });
});
