import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { readPaymentsEnvironment } from "@/lib/payments-env";

type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env['VITE_PAYMENTS_CLIENT_TOKEN'] as string | undefined;

function paymentsEnvironment(): StripeEnv {
  const env = readPaymentsEnvironment();
  if (!env) throw new Error("Payments are not switched on for this site yet.");
  return env;
}


let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    paymentsEnvironment();
    stripePromise = loadStripe(clientToken as string);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return paymentsEnvironment();
}
