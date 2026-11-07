import { describe, expect, it } from "vitest";
import { monthlyPence, type RentConfig } from "./rent-pricing";

const base: RentConfig = { products: [], countries: 1, wholePackage: false, presenter: "none", subdomain: false, founding: false };

describe("rent pricing", () => {
  it("branded stream is £199 with one country included", () => {
    expect(monthlyPence({ ...base, products: ["stream"] })).toBe(19900);
  });
  it("each extra country adds £25", () => {
    expect(monthlyPence({ ...base, products: ["widgets"], countries: 3 })).toBe(2900 + 5000);
  });
  it("whole package adds £399 regardless of country count", () => {
    expect(monthlyPence({ ...base, products: ["dashboard"], countries: 40, wholePackage: true })).toBe(9900 + 39900);
  });
  it("AI presenter adds £50 to the stream; presenting yourself is included", () => {
    expect(monthlyPence({ ...base, products: ["stream"], presenter: "ai" })).toBe(24900);
    expect(monthlyPence({ ...base, products: ["stream"], presenter: "self" })).toBe(19900);
  });
  it("own subdomain adds £50 to the dashboard", () => {
    expect(monthlyPence({ ...base, products: ["dashboard"], subdomain: true })).toBe(14900);
  });
  it("founding customers get 25% off", () => {
    expect(monthlyPence({ ...base, products: ["stream"], founding: true })).toBe(14925);
  });
});
