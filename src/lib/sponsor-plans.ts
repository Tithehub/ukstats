/** Sponsor plan catalogue. Price IDs match the payment provider's lookup keys. */
export const SPONSOR_PRICE_IDS = ["supporter_monthly", "supporter_yearly", "sponsor_monthly", "sponsor_yearly"] as const;
export type SponsorPriceId = (typeof SPONSOR_PRICE_IDS)[number];

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
