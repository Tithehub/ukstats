import { describe, expect, it } from "vitest";
import { RESTORE_BRITAIN_JOIN_URL, RESTORE_BRITAIN_URL } from "./brand";

describe("Restore Britain links", () => {
  it("points at the official Restore Britain domain", () => {
    expect(new URL(RESTORE_BRITAIN_URL).hostname).toBe("www.restorebritain.org.uk");
    expect(new URL(RESTORE_BRITAIN_JOIN_URL).hostname).toBe("www.restorebritain.org.uk");
  });

  it("sends sign-ups to their join page, not to the home page", () => {
    expect(new URL(RESTORE_BRITAIN_JOIN_URL).pathname).toBe("/join_us");
    expect(RESTORE_BRITAIN_JOIN_URL).not.toBe(RESTORE_BRITAIN_URL);
  });
});
