import { describe, expect, it } from "vitest";
import { hasSponsorshipDetails, isPaidStatus, planFromPriceId } from "./sponsor-plans";

describe("sponsor plans", () => {
  it("allows complimentary sponsors to edit without a subscription", () => {
    expect(hasSponsorshipDetails({ plan: "sponsor" }, null)).toBe(true);
    expect(hasSponsorshipDetails(null, null)).toBe(false);
  });
  it("maps price ids to plans", () => {
    expect(planFromPriceId("supporter_yearly")).toBe("supporter");
    expect(planFromPriceId("sponsor_monthly")).toBe("sponsor");
    expect(planFromPriceId("other")).toBeNull();
  });
  it("removes the sponsor line when a subscription is canceled or unpaid", () => {
    expect(isPaidStatus("active")).toBe(true);
    expect(isPaidStatus("canceled")).toBe(false);
    expect(isPaidStatus("unpaid")).toBe(false);
    expect(isPaidStatus("incomplete")).toBe(false);
  });
});
