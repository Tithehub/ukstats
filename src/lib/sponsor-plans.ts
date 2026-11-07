/** Sponsor plan catalogue. Price IDs match the payment provider's lookup keys. */
export const SPONSOR_PRICE_IDS = ["supporter_monthly", "supporter_yearly", "sponsor_monthly", "sponsor_yearly", "sponsor_network_title_monthly", "sponsor_network_monthly", "sponsor_country_monthly"] as const;

/** Slot limits for network placements; null = unlimited. Country slots are one per country, checked at approval. */
export const SPONSOR_SLOT_CAPS: Partial<Record<string, number>> = {
  sponsor_network_title_monthly: 1,
  sponsor_network_monthly: 10,
};

/** True when a capped plan has no slot left. */
export function slotFull(priceId: string, taken: number): boolean {
  const cap = SPONSOR_SLOT_CAPS[priceId];
  return cap != null && taken >= cap;
}
export type SponsorPriceId = (typeof SPONSOR_PRICE_IDS)[number];

/** Complimentary sponsor rows are editable without a payment subscription. */
export function hasSponsorshipDetails(sponsor: unknown, subscription: unknown): boolean {
  return Boolean(sponsor || subscription);
}

export function planFromPriceId(priceId: string | null | undefined): "supporter" | "sponsor" | null {
  if (!priceId) return null;
  if (priceId.startsWith("supporter_")) return "supporter";
  if (priceId.startsWith("sponsor_")) return "sponsor";
  return null;
}

/** A sponsor line shows only while the subscription is paid up (past_due keeps it while payment retries). */
export function isPaidStatus(status: string): boolean {
  return status === "active" || status === "trialing" || status === "past_due";
}
