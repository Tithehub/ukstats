import { describe, expect, it } from "vitest";
import { isPaidStatus, planFromPriceId } from "./sponsor-plans";

describe("sponsor plans", () => {
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
