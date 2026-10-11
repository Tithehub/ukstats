import { describe, expect, it } from "vitest";
import { fmtDate } from "./uk-stats";

// Sept 2026 is BST (UTC+1), so 23:00 UTC on the 21st is already the 22nd in the UK.
describe("fmtDate", () => {
  it("prints the UK day, not the visitor's clock day", () => {
    expect(fmtDate("2026-09-21T23:00:00Z")).toBe("22 Sept 2026");
    expect(fmtDate("2026-09-22T23:00:00Z")).toBe("23 Sept 2026");
  });

  it("keeps a publisher's date-only value on its own day", () => {
    expect(fmtDate("2026-09-22")).toBe("22 Sept 2026");
    expect(fmtDate("2026-09-22T00:00:00Z")).toBe("22 Sept 2026");
  });

  it("says nothing when the publisher supplied no date", () => {
    expect(fmtDate(null)).toBe("—");
  });
});
