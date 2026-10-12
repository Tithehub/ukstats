# Paid sponsorship with Stripe

## Suggested pricing
At £5–10 a month, sponsorship works best as an easy "supporter" product for small businesses and individuals rather than a big ad deal. Two monthly prices plus a yearly discount (two months free) keeps it simple:

| Plan | Monthly | Yearly | What they get |
|---|---|---|---|
| Supporter | £5 | £50 | Name + link in the footer "Supported by" line, rotating with other supporters |
| Sponsor | £10 | £100 | Everything above, plus name, short tagline and link on one topic page of their choice (e.g. house prices) |

- Yearly is highlighted as the better deal; most of the income will come from it.
- Prices are in GBP. Cancel any time from a "Manage subscription" link.
- Later, once the site has more visitors, add a higher "Partner" plan (e.g. £49/month) — not built now.

## What gets built
1. **Turn on Stripe payments** (built into Lovable, test mode first so we can try it without real money; going live means claiming the Stripe account).
2. **Create the 4 prices** above in Stripe.
3. **/advertise page gets "Choose a plan" cards** with a monthly/yearly toggle. Buying needs a quick sign-in so the sponsor can manage it later.
4. **After payment**, the sponsor fills in name, link, tagline (and topic page for Sponsor). It's held as "waiting for approval" — you approve it in /agents before it appears, so nothing breaking the rules goes live.
5. **Automatic on/off**: when a subscription ends or payment fails, the sponsor line is removed automatically.
6. **Footer line rotates** active supporters; topic pages show their Sponsor card away from the figures.
7. Enquiry form stays for anyone wanting something bigger.

## Technical details
- `enable_stripe_payments` (managed, full compliance handling for digital services, UK seller), `batch_create_product` with a tax code for advertising/sponsorship services.
- Checkout via server function (requireSupabaseAuth) creating a subscription Checkout Session; webhook server route under /api/public/stripe-webhook verifies signature and updates `sponsors` (add user_id, plan, stripe_subscription_id, status, approved, topic).
- RLS: owner reads/edits own sponsor row details; only admin sets approved; public reads only approved + active rows.
- Admin approval list added to /agents. Customer portal link for cancellations.
- Save the chosen prices to project memory.
