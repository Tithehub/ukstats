import { describe, expect, it } from "vitest";
import { LIKE_FOR_LIKE_WARNING, SPEECH_ROWS } from "./online-speech";

describe("online speech convictions registry", () => {
  it("every row links to an official https source", () => {
    for (const r of SPEECH_ROWS) expect(r.sourceUrl.startsWith("https://")).toBe(true);
  });
  it("no row shows a figure without a reference period", () => {
    for (const r of SPEECH_ROWS) if (r.value !== null) expect(r.period).toBeTruthy();
  });
  it("warns the rows are not like-for-like", () => {
    expect(LIKE_FOR_LIKE_WARNING).toMatch(/not like-for-like/);
  });
});
