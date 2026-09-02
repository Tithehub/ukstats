# Shareable live snapshot pages with paid durations

Add a one-page, print/PDF-ready version of the register that anyone can create, share to socials, and keep live for a paid-for period (£1 = 24h up to a yearly subscription). Payments are stubbed now and wired to Stripe later.

## What the user gets

1. **"Create a live page" button** on the dashboard. The user picks which metrics to include (all, or a category selection) and a duration tier.
2. **Tiers** (placeholder pricing, editable):
   - £1 — 24 hours
   - £5 — 1 week
   - £15 — 1 month
   - £40 — 6 months
   - £70 — 1 year (subscription later)
   - £0 — free 60-minute preview link, so the feature is usable before payments exist
3. **A shareable URL** `/p/<slug>` that renders the same live data (re-fetched on every visit, never frozen numbers) in a single-page, poster-style layout: masthead, selected metric cards, provenance footer, and a "data pulled at" timestamp.
4. **Download PDF** on that page — a print-optimised stylesheet plus a Download button that opens the browser print-to-PDF dialog, so the PDF always matches the live figures at the moment of download.
5. **Share to socials** — X, LinkedIn, Facebook, WhatsApp, Reddit, and copy-link buttons, plus per-page og:title/og:description/og:image metadata so the link unfurls properly.
6. **Expiry behaviour** — after the paid window, `/p/<slug>` shows an "This live page has expired" screen with a renew/extend option instead of the data. Owners see a countdown ("live for 5 days 3 hours") while it is active.
7. **My pages** — a simple list of pages created from this browser, with status, expiry countdown, and extend/copy/share actions.

## Payments

No live charging in this phase. Selecting a paid tier goes through a checkout step that is clearly marked as pending payment setup and issues the page immediately (or after a manual confirm), with an `unpaid`/`paid` flag recorded. When Stripe is added, that step swaps to a real Stripe Checkout session and the page activates on webhook confirmation — no other part of the flow changes.

## Backend

This needs Lovable Cloud (database + server logic) so links survive across devices and expiry is enforced server-side rather than in the browser.

- `shared_pages` table: `id`, `slug`, `title`, `metric_ids[]`, `tier`, `duration_hours`, `price_pence`, `payment_status`, `expires_at`, `owner_token`, `created_at`, `view_count`.
- Public read is limited to non-expired rows and exposes no owner data; creation, extension, and expiry checks run in server functions.
- Anonymous ownership via a signed `owner_token` in local storage, so no login is required; accounts can be added later without changing the schema.

## Technical notes

- New routes: `src/routes/p.$slug.tsx` (public live page, own `head()` metadata, SSR), `src/routes/create.tsx` (builder + tier picker), `src/routes/my-pages.tsx` (owner list).
- Reuses `getUkStats()` and `MetricCard` — no duplicate data logic, and the same "nothing is estimated" provenance rules apply.
- PDF via a dedicated `@media print` layer in `src/styles.css` (colour-safe tokens, page-break control, cards forced open, chrome hidden) driven by `window.print()`; no server-side PDF renderer, which keeps the output live and avoids Worker-runtime limits.
- Tier definitions live in one `src/lib/tiers.ts` constant so pricing and durations can be edited in one place.
- Expiry is evaluated in the server function that loads the page, not in client code.
