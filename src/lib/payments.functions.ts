import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { tierById } from "./tiers";
import { hashOwnerToken } from "./owner-hash";

export interface PaymentQuote {
  orderId: string;
  chain: string;
  label: string;
  symbol: string;
  network: string;
  address: string;
  /** Exact amount to send, already formatted for the coin's decimals. */
  amount: string;
  gbpPence: number;
  rate: number;
  quoteExpiresAt: string;
  status: string;
  /** Payment URI suitable for a QR code. */
  uri: string;
}

export interface PaymentState {
  status: "quoted" | "seen" | "confirmed" | "expired";
  txHash: string | null;
  /** Amount seen so far when a partial payment landed. */
  receivedAmount: string | null;
  confirmationsSeen: number;
  expiresAt: string | null;
  message: string;
}

function paymentUri(chain: string, address: string, amount: string): string {
  switch (chain) {
    case "btc":
      return `bitcoin:${address}?amount=${amount}`;
    case "eth":
      return `ethereum:${address}?value=${amount}`;
    case "sol":
      return `solana:${address}?amount=${amount}`;
    default:
      return address;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export const listPaymentChains = createServerFn({ method: "GET" }).handler(async () => {
  const { CHAINS } = await import("./payments.server");
  return CHAINS.map((c) => ({
    chain: c.chain,
    label: c.label,
    symbol: c.symbol,
    network: c.network,
    address: c.address,
    confirmations: c.confirmations,
  }));
});

export const createPaymentOrder = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        slug: z.string().min(1).max(80),
        tier: z.string().min(1).max(32),
        chain: z.enum(["eth", "btc", "sol", "trx"]),
        ownerToken: z.string().min(16).max(128),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<PaymentQuote> => {
    const tier = tierById(data.tier);
    if (!tier || tier.pricePence <= 0) throw new Error("That duration does not need a payment.");

    const { chainSpec, gbpRate } = await import("./payments.server");
    const spec = chainSpec(data.chain);
    if (!spec) throw new Error("Unsupported coin");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ownerHash = await hashOwnerToken(data.ownerToken);

    const { data: page } = await supabaseAdmin
      .from("shared_pages")
      .select("id, owner_hash")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!page || page.owner_hash !== ownerHash) throw new Error("Not your page");

    const rate = await gbpRate(spec);
    const unit = 10 ** -spec.decimals;
    const base = Math.ceil(tier.pricePence / 100 / rate / unit) * unit;

    // Give every open order a slightly different amount so an incoming
    // transaction can be matched to exactly one order on a shared wallet.
    const { data: open } = await supabaseAdmin
      .from("payment_orders")
      .select("expected_amount")
      .eq("chain", spec.chain)
      .in("status", ["quoted", "seen"]);
    const taken = new Set((open ?? []).map((o: any) => Number(o.expected_amount).toFixed(spec.decimals)));

    let amount = base;
    for (let i = 0; i < 400; i++) {
      const candidate = Number((base + i * unit).toFixed(spec.decimals));
      if (!taken.has(candidate.toFixed(spec.decimals))) {
        amount = candidate;
        break;
      }
    }
    const amountStr = amount.toFixed(spec.decimals);

    const quoteExpiresAt = new Date(Date.now() + 15 * 60_000).toISOString();
    const { data: order, error } = await supabaseAdmin
      .from("payment_orders")
      .insert({
        slug: data.slug,
        tier: tier.id,
        gbp_pence: tier.pricePence,
        chain: spec.chain,
        address: spec.address,
        expected_amount: amount,
        quote_rate: rate,
        quote_expires_at: quoteExpiresAt,
        status: "quoted",
        owner_hash: ownerHash,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return {
      orderId: order.id,
      chain: spec.chain,
      label: spec.label,
      symbol: spec.symbol,
      network: spec.network,
      address: spec.address,
      amount: amountStr,
      gbpPence: tier.pricePence,
      rate,
      quoteExpiresAt,
      status: "quoted",
      uri: paymentUri(spec.chain, spec.address, amountStr),
    };
  });

export const checkPaymentOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<PaymentState> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { chainSpec, recentPayments } = await import("./payments.server");

    const { data: order } = await supabaseAdmin
      .from("payment_orders")
      .select("*")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order) throw new Error("Unknown payment");

    const spec = chainSpec(order.chain);
    if (!spec) throw new Error("Unsupported coin");

    if (order.status === "confirmed") {
      const { data: page } = await supabaseAdmin
        .from("shared_pages")
        .select("expires_at")
        .eq("slug", order.slug)
        .maybeSingle();
      return {
        status: "confirmed",
        txHash: order.tx_hash,
        receivedAmount: Number(order.expected_amount).toFixed(spec.decimals),
        confirmationsSeen: spec.confirmations,
        expiresAt: page?.expires_at ?? null,
        message: "Payment confirmed — your page is live.",
      };
    }

    const expected = Number(order.expected_amount);
    const floor = expected * 0.98;
    const ceiling = expected * 1.5;
    const createdAt = new Date(order.created_at).getTime() / 1000 - 300;

    let payments: Awaited<ReturnType<typeof recentPayments>> = [];
    try {
      payments = await recentPayments(spec);
    } catch {
      return {
        status: order.status as PaymentState["status"],
        txHash: null,
        receivedAmount: null,
        confirmationsSeen: 0,
        expiresAt: null,
        message: "Checking the network — the explorer is busy, retrying.",
      };
    }

    const { data: used } = await supabaseAdmin
      .from("payment_orders")
      .select("tx_hash")
      .eq("chain", order.chain)
      .not("tx_hash", "is", null);
    const usedHashes = new Set((used ?? []).map((u: any) => u.tx_hash));

    const candidates = payments.filter(
      (p) => !usedHashes.has(p.hash) && (p.time === 0 || p.time >= createdAt) && p.amount <= ceiling,
    );
    const match = candidates.find((p) => p.amount >= floor);

    if (!match) {
      const partial = candidates.find((p) => p.amount > expected * 0.2);
      const expiredQuote = new Date(order.quote_expires_at).getTime() < Date.now();
      return {
        status: expiredQuote ? "expired" : (order.status as PaymentState["status"]),
        txHash: null,
        receivedAmount: partial ? partial.amount.toFixed(spec.decimals) : null,
        confirmationsSeen: 0,
        expiresAt: null,
        message: partial
          ? `Partial payment of ${partial.amount.toFixed(spec.decimals)} ${spec.symbol} received — send the remaining ${(
              expected - partial.amount
            ).toFixed(spec.decimals)} ${spec.symbol} to finish.`
          : expiredQuote
            ? "The 15-minute quote has lapsed. Refresh the quote — any payment you send is still honoured."
            : "Waiting for your payment to appear on the network.",
      };
    }

    if (match.confirmations < spec.confirmations) {
      await supabaseAdmin.from("payment_orders").update({ status: "seen" }).eq("id", order.id);
      return {
        status: "seen",
        txHash: match.hash,
        receivedAmount: match.amount.toFixed(spec.decimals),
        confirmationsSeen: match.confirmations,
        expiresAt: null,
        message: `Payment seen — waiting for ${spec.confirmations} confirmation${spec.confirmations > 1 ? "s" : ""} (${match.confirmations}/${spec.confirmations}).`,
      };
    }

    // Confirmed: claim the transaction, then extend the page.
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from("payment_orders")
      .update({ status: "confirmed", tx_hash: match.hash, confirmed_at: new Date().toISOString() })
      .eq("id", order.id)
      .eq("status", order.status)
      .select()
      .maybeSingle();
    if (claimError || !claimed) throw new Error("Could not record the payment — please refresh.");

    const tier = tierById(order.tier);
    const hours = tier?.hours ?? 24;
    const { data: page } = await supabaseAdmin
      .from("shared_pages")
      .select("id, expires_at")
      .eq("slug", order.slug)
      .maybeSingle();
    const from = Math.max(Date.now(), page ? new Date(page.expires_at).getTime() : Date.now());
    const expiresAt = new Date(from + hours * 3_600_000).toISOString();
    if (page) {
      await supabaseAdmin
        .from("shared_pages")
        .update({
          expires_at: expiresAt,
          tier: order.tier,
          duration_hours: hours,
          price_pence: order.gbp_pence,
          payment_status: "paid",
        })
        .eq("id", page.id);
    }

    return {
      status: "confirmed",
      txHash: match.hash,
      receivedAmount: match.amount.toFixed(spec.decimals),
      confirmationsSeen: match.confirmations,
      expiresAt,
      message: "Payment confirmed — your page is live.",
    };
  });
