import { describe, expect, it } from "vitest";
import { relatedSeries } from "./uk-stats";

const defs = [
  { id: "a", title: "A", category: "Economy", subcategory: "x" },
  { id: "b", title: "B", category: "Economy", subcategory: null },
  { id: "c", title: "C", category: "Economy", subcategory: "x" },
  { id: "d", title: "D", category: "Crime", subcategory: "x" },
];

describe("relatedSeries", () => {
  it("never links the figure itself or other categories", () => {
    expect(relatedSeries(defs, "a").map((r) => r.id)).toEqual(["c", "b"]);
  });
  it("returns nothing for an unknown figure", () => {
    expect(relatedSeries(defs, "zzz")).toEqual([]);
  });
});
