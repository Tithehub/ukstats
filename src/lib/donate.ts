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

export const DONATION_ADDRESSES: DonationAddress[] = [];

export const DONATION_SUGGESTIONS = ["0.005", "0.01", "0.05", "0.1"];

export function qrSrc(text: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(text)}`;
}
