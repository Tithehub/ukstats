import { describe, expect, it } from "vitest";
import { normaliseReviewUrl } from "./review-links";

describe("review links", () => {
  it("accepts the sponsor's own Trustpilot page", () => {
    expect(normaliseReviewUrl("trustpilot", "https://www.trustpilot.com/review/gold.live", "www.gold.live")).toEqual({ url: "https://uk.trustpilot.com/review/gold.live" });
  });
  it("refuses another company's Trustpilot page", () => {
    expect("error" in normaliseReviewUrl("trustpilot", "https://uk.trustpilot.com/review/amazon.co.uk", "gold.live")).toBe(true);
  });
  it("refuses look-alike hosts and plain http", () => {
    expect("error" in normaliseReviewUrl("trustpilot", "https://trustpilot.com.evil.io/review/gold.live", "gold.live")).toBe(true);
    expect("error" in normaliseReviewUrl("facebook", "http://www.facebook.com/x/reviews", "x.com")).toBe(true);
    expect("error" in normaliseReviewUrl("google", "https://user:pw@g.page/r/abc", "x.com")).toBe(true);
  });
  it("accepts Google, Feefo, Reviews.io and Facebook review pages", () => {
    expect("url" in normaliseReviewUrl("google", "https://g.page/r/CabcXYZ/review", "x.com")).toBe(true);
    expect("url" in normaliseReviewUrl("feefo", "https://www.feefo.com/en-GB/reviews/acme", "x.com")).toBe(true);
    expect("url" in normaliseReviewUrl("reviewsio", "https://www.reviews.io/company-reviews/store/acme.com", "x.com")).toBe(true);
    expect("url" in normaliseReviewUrl("facebook", "https://www.facebook.com/acme/reviews", "x.com")).toBe(true);
  });
});
