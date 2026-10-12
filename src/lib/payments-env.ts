// Which payment mode this build of the site runs in: "sandbox" for test cards,
// "live" for real money. Read straight from the build's own public payment key
// and deliberately free of any payment library, so the same answer is available
// while a page is being rendered on the server as well as in the browser.
export type PaymentsEnvironment = "sandbox" | "live";

const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"] as string | undefined;

/** The mode this build was made for, or null when payments aren't switched on at all. */
export function readPaymentsEnvironment(): PaymentsEnvironment | null {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  return null;
}
