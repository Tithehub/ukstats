import { describe, expect, it } from "vitest";
import { DONATIONS_PAUSED, SPONSORSHIP_PAUSED, fundingPaymentError, legalHoldStatement } from "./funding-policy";
import { availableDonationAddresses, DONATION_ADDRESSES } from "./donate";

describe("funding policy", () => {
  it("allows sponsorship payments", () => {
    expect(SPONSORSHIP_PAUSED).toBe(false);
    expect(fundingPaymentError()).toBeNull();
  });
  it("keeps donations paused and hides all crypto addresses, preserving the four wallets", () => {
    expect(DONATIONS_PAUSED).toBe(true);
    expect(availableDonationAddresses()).toEqual([]);
    expect(DONATION_ADDRESSES).toHaveLength(4);
  });
  it("notice says donations paused, sponsorship and licensing open", () => {
    const s = legalHoldStatement();
    expect(s).toContain("Donations are temporarily paused");
    expect(s).toContain("Sponsorship and licensing are open");
  });
});
