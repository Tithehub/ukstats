/**
 * Crypto donation addresses. Left empty until the real wallets are supplied —
 * a placeholder address would send money nowhere, so the page shows a
 * "coming soon" state instead.
 */
export interface DonationAddress {
  /** Display name, e.g. "Ethereum". */
  label: string;
  /** Ticker used in the request, e.g. "ETH". */
  symbol: string;
  /** Network the address lives on, e.g. "Ethereum mainnet". */
  network: string;
  /** The receiving address. */
  address: string;
  /** True when MetaMask can send to it directly (EVM chains). */
  evm?: boolean;
  /** EIP-155 chain id, used to prompt a network switch in MetaMask. */
  chainId?: string;
}

export const DONATION_ADDRESSES: DonationAddress[] = [
  {
    label: "Ethereum",
    symbol: "ETH",
    network: "Ethereum mainnet",
    address: "0xc3CEF9b1C53278351a80d64dD23eFbe64655b440",
    evm: true,
    chainId: "0x1",
  },
  {
    label: "Bitcoin",
    symbol: "BTC",
    network: "Bitcoin",
    address: "bc1qkntmplc4l7edjez0avt958svfwcme70pvxnr6z",
  },
  {
    label: "Solana",
    symbol: "SOL",
    network: "Solana",
    address: "Eb3vSMe5XUQJNNkVZfDPrKhfigRDS4aYc9KxmMNDGsLn",
  },
  {
    label: "Tron",
    symbol: "TRX",
    network: "TRON",
    address: "TBZ9FnHeaabqPhbkbMBUVHWnTHG23nRQ8e",
  },
];

export const DONATION_SUGGESTIONS = ["0.005", "0.01", "0.05", "0.1"];

export function qrSrc(text: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(text)}`;
}
