import { describe, expect, it } from "vitest";
import { checkMessage, cleanName } from "./chat-moderation";

describe("chat rules", () => {
  it("rejects a second message within 3 seconds", () => {
    expect(checkMessage("hi", 1000, 3999).ok).toBe(false);
    expect(checkMessage("hi", 1000, 4000).ok).toBe(true);
  });
  it("rejects messages over 280 characters", () => {
    expect(checkMessage("a".repeat(281), null, 0).ok).toBe(false);
  });
  it("removes links", () => {
    expect(checkMessage("see https://x.com/a now", null, 0)).toEqual({ ok: true, text: "see [link removed] now" });
  });
  it("blocks abusive words", () => {
    expect(checkMessage("you fucking idiot", null, 0).ok).toBe(false);
  });
  it("limits names to 24 safe characters", () => {
    expect(cleanName("<b>Marco</b>" + "x".repeat(40)).length).toBe(24);
  });
});
