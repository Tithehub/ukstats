# File every UKStats plan under "digital goods" for tax

## What changes
Every Stripe product UKStats sells gets the general digital goods tax type (txcd_10000000), so Stripe Tax charges the right amount. Affected products:
- Network sponsor plans: title sponsor, network sponsor, country sponsor
- Supporter and sponsor plans (£5 / £10 monthly and yearly)
- All Rent UKStats products that exist in Stripe

Prices, names, checkout and slot limits stay the same.

## Steps
1. List all products in the test environment and note each one's current tax type.
2. Change any product not filed as digital goods to txcd_10000000. Product IDs stay the same, so live prices and any existing subscriptions keep working.
3. If the tools can't change the tax type on an existing product, you'll get exact click-by-click steps for the Stripe test dashboard (Product → Edit → Tax code → "General – Electronically Supplied Services / digital goods"). You won't need to create new products.
4. Publish so the change copies to live, then check that live checkout still opens for one sponsor plan.

## Technical notes
- Never create new or "_v2" product IDs. Publishing matches test and live products by ID.
- No code changes are expected, because tax codes are stored in Stripe, not on the site.
