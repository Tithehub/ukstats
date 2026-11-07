# Rent UKStats for streamers: a paid, self-serve service

Today /rent takes enquiries only. This plan turns the streamer backdrop into a real monthly subscription that customers can set up and run themselves.

## What customers get

1. **Choose and pay on /rent.** The current options stay: layout, one country (+£3 per extra country, or all countries +£19), UKStats AI presenter (+£10) or presenting yourself (included), and removing the sponsor box (+£49). Prices start at £9 a month. "Subscribe" opens checkout. Signing in is required, using the same login as sponsors.
2. **Streamer dashboard (/rent/dashboard).** Customers see their plan and its status, and a "Manage billing" button lets them update their card, see invoices or cancel. Customers can then set up:
   - Branding: display name, logo, accent colour and "Presented by" text
   - Layout and countries, limited to what they paid for
   - Presenter mode: AI or self, with a live preview
3. **Their own stream page.** Each customer gets a private link at `/s/<their-name>/broadcast`, a fixed 1920×1080 page for OBS, plus a copy-paste OBS setup card. In self-presenter mode the page leaves a webcam area and shows an on-screen autocue of the figures.
4. **Locked figures.** Customers can change branding only. Every figure keeps its source, reference period, data age and next release date, plus a "Data: UKStats · official sources" credit. They can't edit or hide any figure.
5. **Access follows payment.** An active or past-due subscription keeps the page live. After cancelling, it stays live until the end of the paid month, then shows "This stream is not active". When a payment fails, the dashboard warns the customer.
6. **Links everywhere:** in the menu, in the topic bar, on the homepage paid-services card, in the stream studio and on /rent.

## Out of scope for this phase

These stay enquiries-only: branded widgets, dashboards, data API and own web addresses. Donations stay paused.

## Technical details

- **Stripe:** one product per add-on. The base is £9/month, plus quantity-based extra countries at £3, all countries at £19, AI presenter at £10 and no sponsor box at £49. All are monthly, `txcd_10000000`. The checkout builds its line items from `rent-pricing.ts`, so prices are never duplicated. The founding 25% discount becomes a Stripe coupon.
- **New tables:**
  - `rent_subscriptions`: filled by the existing webhook, with an `environment` column and keyed on `price_id`/lookup key
  - `rent_channels`: owner `user_id`, unique slug, branding, layout, countries, presenter and sponsor-box setting
- Both tables get RLS and grants. Owners read and write their own `rent_channels` rows. Public stream pages read safe columns through a server function that checks the subscription is active.
- **Server functions (POST):** create checkout, create billing portal, save channel (re-checks entitlements on the server) and get public channel.
- **Stream page:** `/s/$slug/broadcast` reuses the `globe_.broadcast` components with a branding overlay. Countries are restricted to the paid set, and the UKStats sponsor box is hidden only when that add-on has been paid for.
- **Tests:** checkout line items match `monthlyPence`, entitlement gating (cancelled with a future end date stays active, an expired one doesn't), and the country limit is enforced when saving.
- Record the decision in AGENTS.md, and update the rent and white-label memory.

## Your part

You'll publish once it's built so that live checkout works. Then try one real £9 subscription and cancel it from the dashboard.
