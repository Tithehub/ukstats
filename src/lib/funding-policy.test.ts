import { describe, expect, it } from "vitest";
import { FUNDING_PAUSED, fundingPaymentError } from "./funding-policy";
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
});