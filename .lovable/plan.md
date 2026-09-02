# Crypto payment for timed live pages and widgets

Paid durations (£1 / 24h up to £70 / year) currently create the page but leave it marked
"payment pending". This adds real crypto checkout using the four wallets already on the
Support page, with automatic on-chain confirmation.

## How it works for the visitor

1. Pick statistics, headline and duration on `/create` (or hit "Extend" on `/my-pages`).
2. Choose a coin: Ethereum, Bitcoin, Solana or Tron.
3. The site converts the GBP price to that coin at the live CoinGecko rate and locks the
   quote for 15 minutes, showing a countdown, the exact amount, the address, a QR code,
   and (for Ethereum) a one-click MetaMask send button.
4. The visitor pays. The page polls every ~10 seconds; as soon as a matching payment is
   seen on chain, the page flips to "Paid", the clock starts, and the live link plus the
   embed snippet unlock.
5. If the quote lapses before payment lands, a "Refresh quote" button re-prices at the
   current rate. Payments that arrive late are still matched and honoured.

Until a payment confirms, the page stays in preview state (60 minutes) so nothing is lost.

## Matching a payment to an order

Each order gets a tiny unique tweak added to the expected amount (a few pence worth of
decimals), so an incoming transaction can be tied to one order even though the wallets are
shared. Payments equal to or above the expected amount confirm; small shortfalls (network
fee rounding, under 2%) are accepted; larger shortfalls show "partial payment received"
with the remaining amount.

Confirmation thresholds: Ethereum 2 blocks, Bitcoin 1 confirmation, Solana finalised,
Tron 19 blocks.

## Technical detail

**Database** — new `payment_orders` table (service-role only, matching the existing
`shared_pages` lockdown): id, shared_page_slug, tier, gbp_pence, chain, address,
expected_amount, quote_rate, quote_expires_at, status (`quoted` / `seen` / `confirmed` /
`expired`), tx_hash, confirmed_at, owner_hash. GRANTs to `service_role` only; RLS enabled
with no anon/authenticated policies. All reads go through server functions.

**New server functions** in `src/lib/payments.functions.ts`:
- `createPaymentOrder({ slug, tier, coin, ownerToken })` — prices via CoinGecko
  `simple/price?ids=ethereum,bitcoin,solana,tron&vs_currencies=gbp`, applies the uniqueness
  tweak, stores the order, returns address + amount + expiry (never the owner hash).
- `checkPaymentOrder({ orderId })` — queries the chain, updates status, and on
  confirmation extends `shared_pages.expires_at` by the tier hours and sets
  `payment_status = 'paid'`. Idempotent: an already-confirmed order never extends twice.

**Chain reads** (all free, keyless public endpoints, called server-side with caching and
backoff):
- Bitcoin — `https://blockstream.info/api/address/{addr}/txs`
- Ethereum — `https://ethereum-rpc.publicnode.com` (`eth_getBlockByNumber` scan of recent
  blocks for transfers to the address, plus `eth_getTransactionReceipt` for a pasted hash)
- Solana — `https://api.mainnet-beta.solana.com` (`getSignaturesForAddress` +
  `getTransaction`)
- Tron — `https://api.trongrid.io/v1/accounts/{addr}/transactions`

**UI**
- New `src/components/payments/CryptoCheckout.tsx`: coin tabs, live amount, QR (existing
  `qrSrc` helper), copy button, MetaMask send for ETH, quote countdown, polling status,
  confirmed state.
- `/create` shows checkout after the page is created on a paid tier, instead of navigating
  straight to the page.
- `/my-pages` extend flow reuses the same component in a panel.
- `/p/$slug` shows a "payment pending — unlock" banner for the owner with checkout inline;
  the embed snippet stays hidden until paid.
- Dark/light themed with the existing tokens; no new dependencies.

**Not included**: refunds, VAT handling, or fiat card payment — Stripe can be added later
alongside this without conflict.
