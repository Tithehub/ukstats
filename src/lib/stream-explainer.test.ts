import { describe, expect, it } from "vitest";
import { EXPLAINER_MS, explainerChapters, explainerStep } from "./stream-explainer";
import { explainerAt, promoAt, sponsorBreakAt } from "./stream-schedule";

describe("hourly explainer", () => {
  it("airs from :30 for its full length every hour", () => {
    expect(explainerAt(30 * 60_000).active).toBe(true);
    expect(explainerAt(30 * 60_000 + EXPLAINER_MS - 1).active).toBe(true);
    expect(explainerAt(30 * 60_000 + EXPLAINER_MS).active).toBe(false);
    expect(explainerAt(29 * 60_000).active).toBe(false);
  });
  it("runs between two and three minutes", () => {
    expect(EXPLAINER_MS).toBeGreaterThanOrEqual(120_000);
    expect(EXPLAINER_MS).toBeLessThanOrEqual(180_000);
    expect(explainerAt(30 * 60_000 + 169_000).active).toBe(true);
  });
  it("replaces the :30 promo but keeps the sponsor breaks", () => {
    expect(promoAt(30 * 60_000 + 10_000).active).toBe(false);
    expect(promoAt(15 * 60_000 + 10_000).active).toBe(true);
    expect(sponsorBreakAt(15 * 60_000 + 40_000).active).toBe(true);
    expect(sponsorBreakAt(45 * 60_000 + 40_000).active).toBe(true);
  });
  it("says the real report prices", () => {
    const r = explainerChapters().find((c) => c.id === "reports")!.lines.join(" ");
    for (const p of ["£1.00", "£2.50", "£19.99", "£199.00", "£49.99", "£499.00"]) expect(r).toContain(p);
  });
  it("covers every chapter in order", () => {
    expect(explainerChapters().map((c) => c.id)).toEqual(["welcome", "globe", "sources", "reports", "rent", "sports", "close"]);
    expect(explainerStep(16_000).chapter.id).toBe("globe");
  });
});
