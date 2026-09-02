import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ShareRow } from "@/components/ShareRow";
import { DONATION_ADDRESSES, DONATION_SUGGESTIONS, qrSrc, type DonationAddress } from "@/lib/donate";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support UKStats — keep the official feeds running" },
      {
        name: "description",
        content:
          "UKStats is an independent aggregator of official UK statistics. Support the running costs with a crypto donation via MetaMask, or share the register.",
      },
      { property: "og:title", content: "Support UKStats" },
      {
        property: "og:description",
        content: "Help keep an independent, source-linked register of UK official statistics online.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/support" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/support" }],
  }),
  component: SupportPage,
});

interface Eip1193 {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

function metamask(): Eip1193 | null {
  const eth = (globalThis as unknown as { ethereum?: Eip1193 }).ethereum;
  return eth ?? null;
}

function toWeiHex(amount: string): string {
  const [whole = "0", frac = ""] = amount.split(".");
  const wei = BigInt(whole) * 10n ** 18n + BigInt((frac + "0".repeat(18)).slice(0, 18) || "0");
  return "0x" + wei.toString(16);
}

function AddressCard({ a }: { a: DonationAddress }) {
  const [amount, setAmount] = useState(DONATION_SUGGESTIONS[1]!);
  const [state, setState] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function send() {
    const eth = metamask();
    if (!eth) {
      setState("MetaMask was not detected in this browser.");
      return;
    }
    try {
      setState("Confirm the transaction in MetaMask…");
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      if (a.chainId) {
        try {
          await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: a.chainId }] });
        } catch {
          /* the user can stay on their current chain */
        }
      }
      const hash = (await eth.request({
        method: "eth_sendTransaction",
        params: [{ from: accounts[0], to: a.address, value: toWeiHex(amount) }],
      })) as string;
      setState(`Sent. Transaction ${hash.slice(0, 12)}…`);
    } catch (e) {
      setState((e as Error).message ?? "The transaction was not sent.");
    }
  }

  return (
    <article className="rounded-xl border border-night-line/60 bg-night-panel/60 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">{a.label}</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-night-muted">{a.network}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-start gap-5">
        <img src={qrSrc(a.address)} alt={`QR code for the ${a.label} donation address`} width={110} height={110} className="rounded-md bg-white p-1" />
        <div className="min-w-0 flex-1">
          <code className="block break-all rounded-md bg-night px-2 py-1.5 font-mono text-[11px] text-night-fg">
            {a.address}
          </code>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(a.address);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            className="mt-2 rounded-md border border-night-line/60 px-2 py-1 font-mono text-[11px] text-night-muted hover:border-electric hover:text-electric-soft"
          >
            {copied ? "Address copied" : "Copy address"}
          </button>

          {a.evm ? (
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {DONATION_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setAmount(s)}
                    aria-pressed={amount === s}
                    className={`rounded-md px-2 py-1 font-mono text-[11px] ${
                      amount === s ? "bg-electric text-night" : "border border-night-line/60 text-night-muted"
                    }`}
                  >
                    {s} {a.symbol}
                  </button>
                ))}
                <label className="sr-only" htmlFor={`amt-${a.symbol}`}>
                  Amount in {a.symbol}
                </label>
                <input
                  id={`amt-${a.symbol}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  className="w-24 rounded-md border border-night-line/60 bg-night px-2 py-1 font-mono text-[11px] text-night-fg"
                />
              </div>
              <button
                type="button"
                onClick={() => void send()}
                className="mt-3 rounded-md bg-electric px-3 py-2 text-[12px] font-medium text-night hover:opacity-90"
              >
                Donate with MetaMask
              </button>
              {state ? <p className="mt-2 font-mono text-[11px] text-night-muted">{state}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function SupportPage() {
  return (
    <div className="min-h-screen bg-night font-sans text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Support UKStats</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-night-muted text-pretty">
          UKStats pulls every figure live from the issuing bodies — ONS, Home Office, Police.uk, HM Land Registry, MOD,
          MI5 / JTAC, the Met Office and the Environment Agency. It is free, carries no tracking and never estimates a
          number. Donations cover hosting and the time spent keeping the feeds connected.
        </p>

        <section className="mt-8 space-y-4">
          {DONATION_ADDRESSES.length ? (
            DONATION_ADDRESSES.map((a) => <AddressCard key={a.symbol + a.address} a={a} />)
          ) : (
            <div className="rounded-xl border border-dashed border-night-line/70 bg-night-panel/40 p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">Crypto donations</p>
              <h2 className="mt-2 text-lg font-semibold">Wallet addresses coming soon</h2>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-night-muted text-pretty">
                MetaMask donations are wired up and ready. No address is shown yet because publishing a placeholder
                wallet would send funds nowhere — the real addresses go live here as soon as they are provided.
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-xl border border-night-line/60 bg-night-panel/60 p-5">
          <h2 className="text-sm font-semibold">Other ways to help</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-night-muted text-pretty">
            Sharing the register is worth as much as a donation. Every page links back to the official source, so
            anything you share can be checked at the publisher.
          </p>
          <ShareRow className="mt-4" path="/" title="UKStats — live UK official statistics, every figure sourced" />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
