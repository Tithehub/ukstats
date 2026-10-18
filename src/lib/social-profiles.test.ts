import { describe, expect, it } from "vitest";
import { SOCIAL_PROFILES } from "./social-profiles";

describe("SOCIAL_PROFILES", () => {
  it("lists the X account as @ukstatsglobal", () => {
    const x = SOCIAL_PROFILES.find((p) => p.key === "x");
    expect(x).toBeDefined();
    expect(x!.handle).toBe("@ukstatsglobal");
    expect(x!.url).toBe("https://x.com/ukstatsglobal");
  });

  it("keeps Bluesky and Mastodon alongside X", () => {
    const keys = SOCIAL_PROFILES.map((p) => p.key);
    expect(keys).toContain("bluesky");
    expect(keys).toContain("mastodon");
  });
});
