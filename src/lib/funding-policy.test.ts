import { describe, expect, it } from "vitest";
import { FUNDING_PAUSED, fundingPaymentError } from "./funding-policy";

describe("temporary funding pause", () => {
  it("blocks new sponsorship payments pending further information", () => {
    expect(FUNDING_PAUSED).toBe(true);
    expect(fundingPaymentError()).not.toBeNull();
  });
});