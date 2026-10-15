import { describe, expect, it } from "vitest";
import { FUNDING_PAUSED, fundingPaymentError, legalHoldStatement } from "./funding-policy";
import { availableDonationAddresses, DONATION_ADDRESSES } from "./donate";

describe("temporary funding pause", () => {
  it("blocks new sponsorship payments pending further information", () => {
    expect(FUNDING_PAUSED).toBe(true);
    expect(fundingPaymentError()).not.toBeNull();
  });
  it("offers no crypto donation addresses while preserving all four wallets for later", () => {
    expect(availableDonationAddresses()).toEqual([]);
    expect(DONATION_ADDRESSES).toHaveLength(4);
  });
  it("states the legal hold in plain words: on hold, due diligence, still free", () => {
    const statement = legalHoldStatement();
    expect(statement).toContain("donations and sponsorships are on hold");
    expect(statement).toContain("legal due diligence process");
    expect(statement).toContain("completely free");
  });
});
