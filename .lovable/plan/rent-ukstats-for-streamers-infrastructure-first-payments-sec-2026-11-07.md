# Rent UKStats for streamers: infrastructure first, payments second

## Stage 1: Build the service (no payments yet)

1. **Streamer accounts.** Streamers sign in with the same login as sponsors. Each account can create one "channel" with:
   - a name and a web address (for example `ukstats.co.uk/s/mychannel`)
   - logo, accent colour and "Presented by" text
   - layout (classic, data wall, split or portrait)
   - which countries to show, or all countries
   - presenter: the UKStats AI presenter or presenting yourself
   - whether the UKStats sponsor box shows
2. **Streamer dashboard (/rent/dashboard).** Customers change the settings above and see a live preview. It also shows the OBS link to copy and short setup steps.
3. **Branded stream page (`/s/<name>/broadcast`).** A fixed 1920×1080 page for OBS. It reuses the UKStats stream (globe, Top 6, running order and presenter) with the customer's branding on top and only their chosen countries.
   - In self-presenter mode, it leaves a webcam area and shows an on-screen autocue of the figures.
   - There's also a public watch page at `/s/<name>`.
4. **Locked figures.** Customers can change branding only. Every figure keeps its source, period, data age and next release date, plus a "Data: UKStats · official sources" credit.
5. **Access switch.** Each channel has an "active" status and a list of allowed features. Until payments exist, you turn channels on and grant features from the admin page, so you can onboard the first streamers by hand. An inactive channel shows "This stream is not active".
6. **Links:** on /rent ("Set up your stream"), in the menu, in the stream studio and on the homepage paid-services card.

## Stage 2: Payments and plans (after you approve Stage 1)

These are the Stripe monthly plans at the current prices, all sold as digital goods:
- £9 base
- +£3 per extra country, or +£19 for all countries
- +£10 for the AI presenter
- +£49 to remove the sponsor box
- 25% founding discount

The admin "access switch" then flips automatically on payment and cancellation. A billing button lets customers manage their card, see invoices and cancel.

## Technical details

- **New tables:**
  - `rent_channels`: `user_id` uuid, unique slug, branding fields, layout, `countries` text[], `all_countries`, presenter, `show_sponsor_box`
  - `rent_entitlements`: `user_id`, `active`, `max_countries`, `all_countries`, `ai_presenter`, `no_sponsor_box`, `source` ('manual' | 'stripe'), `expires_at`
- Both tables get grants and RLS: owners read and write their own channel and read their own entitlement, and admins (`has_role`) manage entitlements.
- **Server functions (POST):**
  - `getMyChannel` and `saveMyChannel`, which clamp settings to the entitlement on the server
  - `getPublicChannel(slug)`, which returns safe columns plus whether the channel is active, using a server-side read
  - an admin function to set entitlements
- **Pure helper `rent-entitlements.ts`** (`clampChannel`, `isChannelLive`) with tests: country limit, AI presenter only when granted, sponsor box forced on unless granted, and expired means inactive.
- **Stream page:** the broadcast view is split into a reusable component that takes branding and country options, so the UKStats `/globe/broadcast` stays unchanged.
- Logos go in a storage bucket with owner-only uploads.
- Record the decision in AGENTS.md.
