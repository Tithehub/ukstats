import { describe, expect, it } from "vitest";
import { entitlementFromItems, planPence, rentAccessActive, rentLineItems, RENT_PRICE } from "./rent-checkout";

const pence: Record<string, number> = { [RENT_PRICE.base]: 900, [RENT_PRICE.extraCountry]: 300, [RENT_PRICE.allCountries]: 1900, [RENT_PRICE.ai]: 1000, [RENT_PRICE.noBox]: 4900 };
const total = (items: { price: string; quantity: number }[]) => items.reduce((s, i) => s + pence[i.price]! * i.quantity, 0);

describe("rent checkout", () => {
  it("base plan is £9", () => {
    expect(total(rentLineItems({ countries: 1, allCountries: false, ai: false, noSponsorBox: false }))).toBe(900);
  });
  it("line items match the advertised monthly price", () => {
    for (const p of [
      { countries: 3, allCountries: false, ai: true, noSponsorBox: false },
      { countries: 1, allCountries: true, ai: true, noSponsorBox: true },
      { countries: 5, allCountries: false, ai: false, noSponsorBox: true },
    ]) expect(total(rentLineItems(p))).toBe(planPence(p));
  });
  it("3 countries + AI = £25", () => {
    expect(planPence({ countries: 3, allCountries: false, ai: true, noSponsorBox: false })).toBe(2500);
  });
  it("subscription items unlock matching features", () => {
    expect(entitlementFromItems([{ lookup: RENT_PRICE.base, quantity: 1 }, { lookup: RENT_PRICE.extraCountry, quantity: 2 }, { lookup: RENT_PRICE.ai, quantity: 1 }]))
      .toEqual({ max_countries: 3, all_countries: false, ai_presenter: true, no_sponsor_box: false });
  });
  it("cancelled keeps access until the paid month ends", () => {
    const now = new Date("2026-11-07T12:00:00Z");
    expect(rentAccessActive("canceled", new Date("2026-12-01T00:00:00Z"), now)).toBe(true);
    expect(rentAccessActive("canceled", new Date("2026-11-01T00:00:00Z"), now)).toBe(false);
    expect(rentAccessActive("past_due", null, now)).toBe(true);
    expect(rentAccessActive("incomplete", null, now)).toBe(false);
  });
});
