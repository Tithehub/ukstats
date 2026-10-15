/** Temporary pause; retain checkout, plans and donation configuration for reactivation. */
export const FUNDING_PAUSED = true;
export const FUNDING_PAUSE_MESSAGE = "New sponsorship payments and donations are temporarily paused while we await further information from Restore Britain. UKStats remains free to use.";

/** Legal statement shown site-wide while funding is on hold. */
export const LEGAL_HOLD_STATEMENT =
  "Legal notice: all donations and sponsorships are on hold until the full legal due diligence process is completed. UKStats will remain completely free.";

/** Returns the legal statement only while funding is on hold, so reactivation is one flag. */
export function legalHoldStatement(): string | null {
  return FUNDING_PAUSED ? LEGAL_HOLD_STATEMENT : null;
}

export function fundingPaymentError(): string | null {
  return FUNDING_PAUSED ? FUNDING_PAUSE_MESSAGE : null;
}
