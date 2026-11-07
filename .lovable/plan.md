# White-label UKStats ("brand the stats yourself")

Rent the same verified figures, freshness labels and source links to businesses, councils, media and campaign groups under their own logo and colours. The figures themselves stay identical and free on ukstats.co.uk — customers pay for branding, hosting and convenience, never for "their own" numbers.

## What customers can rent
1. **Branded widgets** — embeddable stat cards/tickers with the customer's logo and colours (builds on the existing embed widget). Small "Data: official sources via UKStats" credit always kept.
2. **Branded dashboard page** — e.g. `ukstats.co.uk/p/acme` or their own subdomain (stats.acme.com), choosing which topics/countries to show.
3. **Branded stream/screen** — the broadcast layout with their logo, for office screens, shops or their own YouTube channel (presenter optional, still labelled AI, still reads only official figures).
4. **Data feed (API)** — clean JSON of figures with source, period, data age and next release, with an API key and usage limits.

## Rules that never change
- No editing, hiding, or overriding figures, sources or dates — branding only.
- Missing figures still show "Not published".
- Source + reference period + data age + next release always visible.
- Banned sponsor categories also apply to white-label customers; admin approves each one.

## Suggested prices (saved alongside the monetisation plan)
- Widgets: £29/month
- Branded dashboard page: £99/month (own subdomain +£50)
- Branded screen/stream: £199/month
- API: £49/month (10k requests), £249/month (250k)
- Founding 25% off for life for the first 10, same as sponsors.

## How it gets built
1. **Customer accounts** — sign-in, organisation profile, logo upload, brand colours, chosen topics.
2. **Admin approval** queue (reuse the sponsor approval flow).
3. **Theme layer** — widgets, dashboard and stream read the customer's brand settings; figures come from the same cached data, unchanged.
4. **API keys** — create/revoke keys, rate limits, usage counter.
5. **Billing** — Stripe subscriptions per tier, built but switched off by the existing funding pause flag until Restore Britain gives the go-ahead.
6. **"Rent UKStats" sales page** with live examples, linked from the menu, footer, sponsors page and homepage (per the CTA rule).
7. Tests: figures in a branded view match the public figure exactly; missing figures still read "Not published"; paused flag blocks checkout.

## Technical details
- New tables: `organisations`, `org_members`, `org_brand` (logo, colours, topics, slug, custom domain), `api_keys` (hashed), `api_usage`; RLS by membership; admin via `user_roles`.
- Branded pages at `/p/$slug`; widgets take `?org=slug`; stream takes `?org=slug`.
- API at `/api/public/v1/*`, verifying hashed key per request, served from `payload_cache` only (no live publisher calls).
- Custom subdomains handled via site-host.ts mapping; customer points a CNAME.
- Checkout stays behind `FUNDING_PAUSED`.

## Open question
Payments remain paused — I can build everything now with checkout switched off, so it's ready the day the pause lifts.
