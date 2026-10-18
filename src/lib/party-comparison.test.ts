import { describe, expect, it } from "vitest";
import { rankParties, recentPartyPolls, rankHeadlinePoll } from "./party-comparison";

describe("published party comparisons", () => {
  it("keeps equal published values tied without mutating the source", () => {
    const rows = [{ seats: 4 }, { seats: 72 }, { seats: 4 }];
    expect(rankParties(rows, row => row.seats).map(row => row.rank)).toEqual([1, 2, 2]);
    expect(rows.map(row => row.seats)).toEqual([4, 72, 4]);
  });
  it("does not mix Scotland/Wales-only parties into headline GB polling ranks", () => {
    expect(rankHeadlinePoll({ Labour: 30, "Reform UK": 30, SNP: 35, "Plaid Cymru": 50 }).map(row => [row.party.name, row.rank]))
      .toEqual([["Labour", 1], ["Reform UK", 1]]);
  });
  it("rejects stale, future, undated and failed releases instead of treating them as current", () => {
    const base = { pollster: "Publisher", url: "https://example.org", sampleSize: 1000, shares: { Labour: 30 } };
    const rows = [
      { ...base, fieldworkEnd: "2026-10-17" },
      { ...base, fieldworkEnd: "2026-09-01" },
      { ...base, fieldworkEnd: "2026-10-19" },
      { ...base, fieldworkEnd: null },
      { ...base, fieldworkEnd: "2026-10-17", error: "Unavailable" },
    ];
    expect(recentPartyPolls(rows, Date.parse("2026-10-18T12:00:00Z"), 21).map(row => row.fieldworkEnd)).toEqual(["2026-10-17"]);
  });
});