/** Sponsorship and licensing are open; donations stay paused. Keep donation configuration for reactivation. */
export const SPONSORSHIP_PAUSED = false;
export const DONATIONS_PAUSED = true;

export const SPONSORSHIP_PAUSE_MESSAGE = "New sponsorship payments are temporarily paused. UKStats remains free to use.";
export const DONATIONS_PAUSE_MESSAGE = "Donations are temporarily paused. UKStats remains free to use.";

/** Short notice shown wherever donations are mentioned. */
export const DONATIONS_NOTICE =
  "Donations are temporarily paused. Sponsorship and licensing are open. UKStats stays free to use.";

/** Returns the donations notice only while donations are paused. */
export function legalHoldStatement(): string | null {
  return DONATIONS_PAUSED ? DONATIONS_NOTICE : null;
}

/** Error returned by sponsor checkout when sponsorship is paused. */
export function fundingPaymentError(): string | null {
  return SPONSORSHIP_PAUSED ? SPONSORSHIP_PAUSE_MESSAGE : null;
}
