import { describe, expect, it } from "vitest";
import { scriptForSponsorBreak } from "./stream-script";
import { SPONSOR_BREAK_STARTS, sponsorBreakAt } from "./stream-schedule";

const rows = [{ name: "YachtFino", label: "yachtfino.com" }, { name: "SS Global", label: "ssgloballegalservices.com" }];

describe("sponsor break voice", () => {
  it("breaks start at :15:40 and :45:40", () => {
    expect(SPONSOR_BREAK_STARTS).toEqual([15 * 60_000 + 40_000, 45 * 60_000 + 40_000]);
  });
  it("names the sponsor whose card is on screen", () => {
    for (const s of SPONSOR_BREAK_STARTS) {
      const b = sponsorBreakAt(s + 12_000);
      expect(b.active).toBe(true);
      expect(scriptForSponsorBreak(rows, b.msIntoBreak)!.line).toContain("SS Global");
    }
    expect(scriptForSponsorBreak(rows, 0)!.line).toContain("YachtFino");
  });
  it("says nothing about sponsors when none are approved", () => {
    expect(scriptForSponsorBreak([], 5_000)).toBeNull();
  });
});
