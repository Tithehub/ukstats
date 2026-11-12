import { describe, expect, it } from "vitest";
import { looksLikeRealName } from "./profile";
describe("looksLikeRealName", () => {
  it("flags a nickname that repeats the email name", () => { expect(looksLikeRealName("John Smith", "john.smith@mail.com")).toBe(true); expect(looksLikeRealName("Smithy", "john.smith@mail.com")).toBe(true); });
  it("lets an unrelated nickname through", () => { expect(looksLikeRealName("StatHunter", "john.smith@mail.com")).toBe(false); });
});
