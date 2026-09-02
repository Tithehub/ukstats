/**
 * Server-only crypto helpers: live GBP pricing and keyless on-chain lookups.
 * No API keys are required by any of these endpoints.
 */

export type Chain = "eth" | "btc" | "sol" | "trx";

export interface ChainSpec {
  chain: Chain;
  label: string;
  symbol: string;
  network: string;
  address: string;
  decimals: number;
  coingeckoId: string;
  /** Confirmations required before the payment is accepted. */
  confirmations: number;
}

export const CHAINS: ChainSpec[] = [
  {
    chain: "eth",
    label: "Ethereum",
    symbol: "ETH",
    network: "Ethereum mainnet",
    address: "0xc3CEF9b1C53278351a80d64dD23eFbe64655b440",
    decimals: 6,
    coingeckoId: "ethereum",
    confirmations: 2,
  },
  {
    chain: "btc",
    label: "Bitcoin",
    symbol: "BTC",
    network: "Bitcoin",
    address: "bc1qkntmplc4l7edjez0avt958svfwcme70pvxnr6z",
    decimals: 8,
    coingeckoId: "bitcoin",
    confirmations: 1,
  },
  {
    chain: "sol",
    label: "Solana",
    symbol: "SOL",
    network: "Solana",
    address: "Eb3vSMe5XUQJNNkVZfDPrKhfigRDS4aYc9KxmMNDGsLn",
    decimals: 6,
    coingeckoId: "solana",
    confirmations: 1,
  },
  {
    chain: "trx",
    label: "Tron",
    symbol: "TRX",
    network: "TRON",
    address: "TBZ9FnHeaabqPhbkbMBUVHWnTHG23nRQ8e",
    decimals: 6,
    coingeckoId: "tron",
    confirmations: 19,
  },
];

export function chainSpec(chain: string): ChainSpec | undefined {
  return CHAINS.find((c) => c.chain === chain);
}

const priceCache = new Map<string, { gbp: number; at: number }>();

/** Live GBP price of one coin unit, cached for 60 seconds. */
export async function gbpRate(spec: ChainSpec): Promise<number> {
  const cached = priceCache.get(spec.coingeckoId);
  if (cached && Date.now() - cached.at < 60_000) return cached.gbp;

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${spec.coingeckoId}&vs_currencies=gbp`,
    { headers: { accept: "application/json" } },
  );
  if (!res.ok) {
    if (cached) return cached.gbp;
    throw new Error(`Could not read the ${spec.symbol} exchange rate right now. Please try again.`);
  }
  const json = (await res.json()) as Record<string, { gbp?: number }>;
  const gbp = json[spec.coingeckoId]?.gbp;
  if (!gbp || gbp <= 0) {
    if (cached) return cached.gbp;
    throw new Error(`Could not read the ${spec.symbol} exchange rate right now. Please try again.`);
  }
  priceCache.set(spec.coingeckoId, { gbp, at: Date.now() });
  return gbp;
}

export interface IncomingPayment {
  hash: string;
  /** Amount received by our address, in whole coin units. */
  amount: number;
  /** Unix seconds, 0 when unknown/unconfirmed. */
  time: number;
  confirmations: number;
}

async function jsonFetch(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, { ...init, headers: { accept: "application/json", ...(init?.headers ?? {}) } });
  if (!res.ok) throw new Error(`Chain lookup failed (${res.status})`);
  return res.json();
}

/* eslint-disable @typescript-eslint/no-explicit-any */

async function btcPayments(address: string): Promise<IncomingPayment[]> {
  const txs = (await jsonFetch(`https://blockstream.info/api/address/${address}/txs`)) as any[];
  const tip = (await (await fetch("https://blockstream.info/api/blocks/tip/height")).text()).trim();
  const tipHeight = Number(tip) || 0;
  return txs.map((tx) => {
    const sats = (tx.vout ?? [])
      .filter((v: any) => v.scriptpubkey_address === address)
      .reduce((sum: number, v: any) => sum + (v.value ?? 0), 0);
    const height = tx.status?.block_height ?? 0;
    return {
      hash: tx.txid as string,
      amount: sats / 1e8,
      time: tx.status?.block_time ?? 0,
      confirmations: tx.status?.confirmed && tipHeight && height ? tipHeight - height + 1 : 0,
    };
  });
}

async function ethPayments(address: string): Promise<IncomingPayment[]> {
  const json = (await jsonFetch(
    `https://eth.blockscout.com/api?module=account&action=txlist&address=${address}&sort=desc&page=1&offset=30`,
  )) as any;
  const rows: any[] = Array.isArray(json?.result) ? json.result : [];
  return rows
    .filter((r) => String(r.to ?? "").toLowerCase() === address.toLowerCase() && r.isError !== "1")
    .map((r) => ({
      hash: r.hash as string,
      amount: Number(r.value ?? 0) / 1e18,
      time: Number(r.timeStamp ?? 0),
      confirmations: Number(r.confirmations ?? 0) || 1,
    }));
}

async function solPayments(address: string): Promise<IncomingPayment[]> {
  const rpc = "https://api.mainnet-beta.solana.com";
  const sigRes = (await jsonFetch(rpc, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getSignaturesForAddress",
      params: [address, { limit: 15 }],
    }),
  })) as any;
  const sigs: any[] = sigRes?.result ?? [];
  const out: IncomingPayment[] = [];
  for (const s of sigs.slice(0, 10)) {
    if (s.err) continue;
    const txRes = (await jsonFetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTransaction",
        params: [s.signature, { maxSupportedTransactionVersion: 0, encoding: "jsonParsed" }],
      }),
    })) as any;
    const tx = txRes?.result;
    if (!tx?.meta) continue;
    const keys: any[] = tx.transaction?.message?.accountKeys ?? [];
    const idx = keys.findIndex((k) => (typeof k === "string" ? k : k.pubkey) === address);
    if (idx < 0) continue;
    const delta = (tx.meta.postBalances?.[idx] ?? 0) - (tx.meta.preBalances?.[idx] ?? 0);
    if (delta <= 0) continue;
    out.push({
      hash: s.signature as string,
      amount: delta / 1e9,
      time: tx.blockTime ?? s.blockTime ?? 0,
      confirmations: s.confirmationStatus === "finalized" ? 1 : 0,
    });
  }
  return out;
}

async function trxPayments(address: string): Promise<IncomingPayment[]> {
  const json = (await jsonFetch(
    `https://api.trongrid.io/v1/accounts/${address}/transactions?only_to=true&limit=30`,
  )) as any;
  const rows: any[] = json?.data ?? [];
  const now = Math.floor(Date.now() / 1000);
  return rows
    .map((r) => {
      const c = r.raw_data?.contract?.[0];
      if (c?.type !== "TransferContract") return null;
      const v = c.parameter?.value ?? {};
      if (r.ret?.[0]?.contractRet && r.ret[0].contractRet !== "SUCCESS") return null;
      const time = Math.floor((r.block_timestamp ?? 0) / 1000);
      return {
        hash: r.txID as string,
        amount: Number(v.amount ?? 0) / 1e6,
        time,
        // Tron blocks are ~3s; approximate confirmations from age.
        confirmations: time ? Math.max(1, Math.floor((now - time) / 3)) : 0,
      } as IncomingPayment;
    })
    .filter((p): p is IncomingPayment => p !== null);
}

export async function recentPayments(spec: ChainSpec): Promise<IncomingPayment[]> {
  switch (spec.chain) {
    case "btc":
      return btcPayments(spec.address);
    case "eth":
      return ethPayments(spec.address);
    case "sol":
      return solPayments(spec.address);
    case "trx":
      return trxPayments(spec.address);
  }
}
