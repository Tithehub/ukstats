# Go live with payments on ukstats.co.uk

## Where we are
Stripe is fully connected and live: all five go-live steps are complete (account claimed, go-live form done, Lovable app installed on the live account, live API keys provisioned, readiness check passed). Nothing is left to do in Stripe.

The sponsorship feature (Supporter £5/£50, Sponsor £10/£100 plans on /advertise, admin approval in /agents, footer "Supported by" line) is built and working in preview only.

## Plan

### 1. Publish the site
- Publish so /advertise, the checkout flow, and the footer sponsor line go live on ukstats.co.uk.
- Publishing also syncs the four products/prices from test to live mode.

### 2. Verify the live payment end-to-end
One real £5 payment, done by Marco:
- Sign in on the live site, open /advertise, choose Supporter £5/month (or yearly), pay with a real card.
- Fill in the name/link form after payment.
- Marco approves the line in /agents (admin).
- Confirm the "Supported by" line appears in the footer of ukstats.co.uk.
- Decide: keep the £5 as the first supporter payment, or refund it from Stripe.

### 3. Confirm clean live state
- Test-mode banner no longer shows on /advertise.
- Footer shows the approved live sponsor line only (test-mode lines already filtered out).

## Not in this round
- Topic-page sponsor cards (dropped earlier; revisit only if Marco asks).
- Crypto donation addresses (waiting on Marco).
- Reddit outreach and release-day social posts (Marco sends/approves).
