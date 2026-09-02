import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { checkPaymentOrder, createPaymentOrder, type PaymentQuote, type PaymentState } from "@/lib/payments.functions";
import { qrSrc } from "@/lib/donate";
import { tierById } from "@/lib/tiers";

const COINS: { chain: "eth" | "btc" | "sol" | "trx"; label: string; symbol: string }[] = [
  { chain: "eth", label: "Ethereum", symbol: "ETH" },
  { chain: "btc", label: "Bitcoin", symbol: "BTC" },
  { chain: "sol", label: "Solana", symbol: "SOL" },
  { chain: "trx", label: "Tron", symbol: "TRX" },
];

function useCountdown(iso: string | undefined): string {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => tick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  if (!iso) return "";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "quote lapsed";
  const s = Math.floor(diff / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} left`;
}

interface Props {
  slug: string;
  tier: string;
  ownerToken: string;
  onConfirmed?: () => void;
}

export function CryptoCheckout({ slug, tier, ownerToken, onConfirmed }: Props) {
  const create = useServerFn(createPaymentOrder);
  const check = useServerFn(checkPaymentOrder);

  const [chain, setChain] = useState<"eth" | "btc" | "sol" | "trx">("eth");
  const [quote, setQuote] = useState<PaymentQuote | null>(null);
  const [state, setState] = useState<PaymentState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const confirmedRef = useRef(false);

  const t = tierById(tier);
  const remaining = useCountdown(quote?.quoteExpiresAt);
  const confirmed = state?.status === "confirmed";

  async function quoteFor(next: typeof chain) {
    setChain(next);
    setError(null);
    setState(null);
    setBusy(true);
    try {
      const q = await create({ data: { slug, tier, chain: next, ownerToken } });
      setQuote(q);
    } catch (e) {
      setQuote(null);
      setError(e instanceof Error ? e.message : "Could not price that coin right now.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void quoteFor("eth");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, tier]);

  useEffect(() => {
    if (!quote || confirmed) return;
    let stop = false;
    const poll = async () => {
      try {
        const s = await check({ data: { orderId: quote.orderId } });
        if (stop) return;
        setState(s);
        if (s.status === "confirmed" && !confirmedRef.current) {
          confirmedRef.current = true;
          onConfirmed?.();
        }
      } catch {
        /* transient network/explorer failure — keep polling */
      }
    };
    void poll();
    const id = window.setInterval(() => void poll(), 10_000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote?.orderId, confirmed]);

  async function payWithMetaMask() {
    const eth = (window as unknown as { ethereum?: any }).ethereum;
    if (!eth || !quote) {
      window.open("https://metamask.io/download/", "_blank", "noreferrer");
      return;
    }
    try {
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x1" }] }).catch(() => undefined);
      const wei = BigInt(Math.round(Number(quote.amount) * 1e18));
      await eth.request({
        method: "eth_sendTransaction",
        params: [{ from: accounts[0], to: quote.address, value: `0x${wei.toString(16)}` }],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "MetaMask cancelled the payment.");
    }
  }

  return (
    <section className="rounded-xl bg-card/60 p-5 ring-1 ring-ink/10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight">
            Pay {t?.price ?? ""} in crypto · {t?.label ?? tier}
          </h2>
          <p className="mt-1 text-[13px] text-steel">
            Your page stays live for 60 minutes as a preview. The moment the payment confirms on chain, the full
            duration and the embed snippet unlock.
          </p>
        </div>
        {confirmed ? (
          <span className="rounded-full bg-fresh/10 px-3 py-1 font-mono text-[11px] text-fresh">Paid</span>
        ) : (
          <span className="rounded-full bg-ageing/10 px-3 py-1 font-mono text-[11px] text-ageing">Awaiting payment</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {COINS.map((c) => (
          <button
            key={c.chain}
            disabled={busy || confirmed}
            onClick={() => void quoteFor(c.chain)}
            className={`rounded-md px-3 py-1.5 font-mono text-[11px] transition-colors disabled:opacity-50 ${
              chain === c.chain ? "bg-ink text-ground" : "bg-ink/5 text-steel hover:bg-ink/10"
            }`}
          >
            {c.label} · {c.symbol}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 font-mono text-[12px] text-overdue">{error}</p> : null}

      {busy && !quote ? <p className="mt-4 font-mono text-[12px] text-steel/60">Pricing…</p> : null}

      {quote ? (
        <div className="mt-5 grid gap-5 sm:grid-cols-[220px_1fr]">
          <div className="rounded-lg bg-ground p-3 ring-1 ring-ink/10">
            <img
              src={qrSrc(quote.uri)}
              width={220}
              height={220}
              alt={`QR code for the ${quote.label} payment address`}
              className="h-auto w-full rounded"
              loading="lazy"
            />
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-steel/60">Send exactly</p>
            <p className="mt-1 font-mono text-[22px] font-semibold tracking-tight">
              {quote.amount} {quote.symbol}
            </p>
            <p className="mt-1 font-mono text-[11px] text-steel/70">
              £{(quote.gbpPence / 100).toFixed(2)} at £{quote.rate.toLocaleString("en-GB", { maximumFractionDigits: 2 })}
              /{quote.symbol} · {quote.network} · {remaining}
            </p>

            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-steel/60">To address</p>
            <p className="mt-1 break-all font-mono text-[12px]">{quote.address}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  void navigator.clipboard?.writeText(quote.address);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1600);
                }}
                className="rounded-md bg-ink/5 px-2.5 py-1.5 font-mono text-[11px] text-steel hover:bg-ink/10"
              >
                {copied ? "Address copied" : "Copy address"}
              </button>
              <button
                onClick={() => void navigator.clipboard?.writeText(quote.amount)}
                className="rounded-md bg-ink/5 px-2.5 py-1.5 font-mono text-[11px] text-steel hover:bg-ink/10"
              >
                Copy amount
              </button>
              {quote.chain === "eth" ? (
                <button
                  onClick={() => void payWithMetaMask()}
                  disabled={confirmed}
                  className="rounded-md bg-ink px-3 py-1.5 font-mono text-[11px] text-ground hover:bg-steel disabled:opacity-50"
                >
                  Pay with MetaMask
                </button>
              ) : null}
              <button
                onClick={() => void quoteFor(quote.chain as typeof chain)}
                disabled={busy || confirmed}
                className="rounded-md bg-ink/5 px-2.5 py-1.5 font-mono text-[11px] text-steel hover:bg-ink/10 disabled:opacity-50"
              >
                Refresh quote
              </button>
            </div>

            <p
              className={`mt-4 font-mono text-[12px] ${
                confirmed ? "text-fresh" : state?.status === "seen" ? "text-ageing" : "text-steel/70"
              }`}
              aria-live="polite"
            >
              {state?.message ?? "Waiting for your payment to appear on the network."}
            </p>
            {state?.txHash ? <p className="mt-1 break-all font-mono text-[11px] text-steel/50">{state.txHash}</p> : null}
            <p className="mt-3 font-mono text-[10px] text-steel/50">
              Send the exact amount shown — it identifies your order. Payments that arrive after the quote lapses are
              still honoured; just refresh the quote to see the current rate.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
