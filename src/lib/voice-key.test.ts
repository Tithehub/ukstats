import { describe, expect, it } from "vitest";
import { voiceKeyMatches } from "./voice-key";

const secret = "a".repeat(48);
describe("voiceKeyMatches", () => {
  it("allows the right key", () => expect(voiceKeyMatches(secret, secret)).toBe(true));
  it("refuses a wrong key", () => expect(voiceKeyMatches("a".repeat(47) + "b", secret)).toBe(false));
  it("refuses a missing key or missing secret", () => {
    expect(voiceKeyMatches(undefined, secret)).toBe(false);
    expect(voiceKeyMatches(secret, undefined)).toBe(false);
  });
});
