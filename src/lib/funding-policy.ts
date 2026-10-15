/** Temporary pause; retain checkout, plans and donation configuration for reactivation. */
export const FUNDING_PAUSED = true;
export const FUNDING_PAUSE_MESSAGE = "New sponsorship payments and donations are temporarily paused while we await further information from Restore Britain. UKStats remains free to use.";

export function fundingPaymentError(): string | null {
  return FUNDING_PAUSED ? FUNDING_PAUSE_MESSAGE : null;
}