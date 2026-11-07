import { describe, expect, it } from "vitest";
import { monthlyPence, type RentConfig } from "./rent-pricing";
import { slotFull } from "./sponsor-plans";

const base: RentConfig = { products: [], countries: 1, wholePackage: false, presenter: "none", subdomain: false, founding: false };

describe("rent pricing", () => {
  it("stream backdrop is £9 with one country included", () => {
    expect(monthlyPence({ ...base, products: ["stream"] })).toBe(900);
  });
  it("each extra country adds £3", () => {
    expect(monthlyPence({ ...base, products: ["stream"], countries: 3 })).toBe(900 + 600);
  });
  it("every country adds £19 regardless of count", () => {
    expect(monthlyPence({ ...base, products: ["stream"], countries: 40, wholePackage: true })).toBe(900 + 1900);
  });
  it("AI presenter adds £10; presenting yourself is included", () => {
    expect(monthlyPence({ ...base, products: ["stream"], presenter: "ai" })).toBe(1900);
    expect(monthlyPence({ ...base, products: ["stream"], presenter: "self" })).toBe(900);
  });
  it("removing the sponsor box adds £49", () => {
    expect(monthlyPence({ ...base, products: ["stream"], noSponsorBox: true })).toBe(5800);
  });
  it("own subdomain adds £50 to the dashboard", () => {
    expect(monthlyPence({ ...base, products: ["dashboard"], subdomain: true })).toBe(14900);
  });
  it("founding customers get 25% off", () => {
    expect(monthlyPence({ ...base, products: ["dashboard"], founding: true })).toBe(7425);
  });
});

describe("sponsor slots", () => {
  it("one title sponsor and up to ten network sponsors", () => {
    expect(slotFull("sponsor_network_title_monthly", 1)).toBe(true);
    expect(slotFull("sponsor_network_monthly", 9)).toBe(false);
    expect(slotFull("sponsor_network_monthly", 10)).toBe(true);
  });
});
