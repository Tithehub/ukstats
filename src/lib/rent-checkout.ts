// Pure mapping between a streamer's plan choices, Stripe line items and the features they unlock.
import { monthlyPence } from "@/lib/rent-pricing";
import type { Entitlement } from "@/lib/rent-entitlements";

export const RENT_PRICE = {
  base: "rent_stream_base_monthly",
  extraCountry: "rent_extra_country_monthly",
  allCountries: "rent_all_countries_monthly",
  ai: "rent_ai_presenter_monthly",
  noBox: "rent_no_sponsor_box_monthly",
} as const;
export const RENT_PRICE_IDS: string[] = Object.values(RENT_PRICE);
export const FOUNDING_RENT_SLOTS = 10;

export interface RentPlan { countries: number; allCountries: boolean; ai: boolean; noSponsorBox: boolean }

export function normalisePlan(p: RentPlan): RentPlan {
  const n = Math.round(Number(p.countries));
  return { countries: Math.min(300, Math.max(1, Number.isFinite(n) ? n : 1)), allCountries: !!p.allCountries, ai: !!p.ai, noSponsorBox: !!p.noSponsorBox };
}

export function rentLineItems(plan: RentPlan): { price: string; quantity: number }[] {
  const p = normalisePlan(plan);
  const items: { price: string; quantity: number }[] = [{ price: RENT_PRICE.base, quantity: 1 }];
  if (p.allCountries) items.push({ price: RENT_PRICE.allCountries, quantity: 1 });
  else if (p.countries > 1) items.push({ price: RENT_PRICE.extraCountry, quantity: p.countries - 1 });
  if (p.ai) items.push({ price: RENT_PRICE.ai, quantity: 1 });
  if (p.noSponsorBox) items.push({ price: RENT_PRICE.noBox, quantity: 1 });
  return items;
}

/** Monthly pence for a plan, from the shared price list. */
export const planPence = (p: RentPlan, founding = false) => {
  const n = normalisePlan(p);
  return monthlyPence({ products: ["stream"], countries: n.countries, wholePackage: n.allCountries, presenter: n.ai ? "ai" : "self", subdomain: false, founding, noSponsorBox: n.noSponsorBox });
};

/** Features unlocked by the items on a live Stripe subscription. */
export function entitlementFromItems(items: { lookup: string | null; quantity: number }[]): Omit<Entitlement, "active" | "expires_at"> {
  const has = (id: string) => items.some((i) => i.lookup === id);
  const extra = items.find((i) => i.lookup === RENT_PRICE.extraCountry)?.quantity ?? 0;
  return { max_countries: 1 + extra, all_countries: has(RENT_PRICE.allCountries), ai_presenter: has(RENT_PRICE.ai), no_sponsor_box: has(RENT_PRICE.noBox) };
}

/** Access continues for active/trialing/past_due, and for canceled until the paid period ends. */
export function rentAccessActive(status: string, periodEnd: Date | null, now: Date): boolean {
  if (["active", "trialing", "past_due"].includes(status)) return true;
  return status === "canceled" && !!periodEnd && periodEnd.getTime() > now.getTime();
}
