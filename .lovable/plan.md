# Add the four crypto donation addresses

The Support page is already built with QR codes, copy buttons, MetaMask sends, and a "coming soon" state. This replaces the empty address list with the real wallets.

## Addresses to add in `src/lib/donate.ts`

- **Ethereum (ETH)** — `0xc3CEF9b1C53278351a80d64dD23eFbe64655b440` — EVM, chain id `0x1`, MetaMask send enabled
- **Bitcoin (BTC)** — `bc1qkntmplc4l7edjez0avt958svfwcme70pvxnr6z` — QR + copy only (non-EVM)
- **Solana (SOL)** — `Eb3vSMe5XUQJNNkVZfDPrKhfigRDS4aYc9KxmMNDGsLn` — QR + copy only
- **Tron (TRX)** — `TBZ9FnHeaabqPhbkbMBUVHWnTHG23nRQ8e` — QR + copy only

## What changes

1. Populate `DONATION_ADDRESSES` with the four entries above; each card on `/support` automatically gets a generated QR code (already handled by `qrSrc`), a copy-address button, and the correct network label.
2. ETH gets the "Donate with MetaMask" button with editable amounts in ETH; BTC/SOL/TRX show QR + copy only.
3. The "Wallet addresses coming soon" placeholder disappears automatically once the list is non-empty.
4. Verify `/support` renders all four cards and the MetaMask flow for ETH via the preview.

## Technical notes

- One file edit (`src/lib/donate.ts`); no routing, backend, or design changes.
- MetaMask sends apply only to the EVM (Ethereum) entry — MetaMask does not handle BTC, Solana, or Tron addresses.
- If you later want Polygon/Base variants of the ETH address, they can be added as extra entries with their own chain ids.
