# Sponsors and Rent UKStats on, donations stay paused, then a site tidy-up

## Part 1: Payments (do now)

**Change:**
- **Sponsorship is back on.** The sponsor plans on /advertise and the sponsor dashboard show working "Choose a plan" buttons and live Stripe checkout again. New sponsors still need admin approval before they appear on the site or stream, and the banned categories still apply.
- **Rent UKStats goes live.** The "Reserve my setup" enquiry form stays as it is. Customers don't pay online yet, because the branded pages and streams still have to be built.
- **Donations stay paused.** The support/donate page keeps its pause message, and the crypto addresses stay hidden.
- **Rewritten notices.** The "all donations and sponsorships are on hold" legal notice comes off the sponsor, advertise, rent and footer sections. Where donations are mentioned, a short notice says: "Donations are temporarily paused. Sponsorship and licensing are open. UKStats stays free to use."
- **Footer dedication:** it says the site is funded by clearly labelled business sponsors and licensing. It no longer says everything is paused.
- **Publish** to ukstats.co.uk.

**Checks:** sign in to the preview and open a sponsor plan to confirm the Stripe checkout loads. Live payments use your verified Stripe account. Confirm the donate page is still paused and the crypto addresses are hidden.

## Part 2: World-class tidy-up (after Part 1)

1. **Review:** screenshot every main page at phone, tablet and desktop sizes. List the overlaps, the clutter, links that repeat, pages that are hard to find and slow pages.
2. **Show you a short list** of the proposed fixes, with before-and-after pictures, before I change anything. This follows your rule to see examples first.
3. **Likely areas:** a simpler top menu grouped into sections (Stats, World, Globe & Live, Topics, Business). A cleaner homepage order. Consistent cards and spacing. Fewer repeated notices. Faster first load.

Nothing in Part 2 changes until you approve the list.

## Technical details
- Split `FUNDING_PAUSED` in `src/lib/funding-policy.ts` into `SPONSORSHIP_PAUSED = false` and `DONATIONS_PAUSED = true`. Make the following code read the matching flag:
  - Sponsorship: `SponsorPlans.tsx`, `advertise.tsx`, `sponsor.functions.ts`
  - Donations: `support.tsx`, `donate.ts`
  - `stream-clips.ts` stays disabled.
- `legalHoldStatement()` becomes a donations-only notice. Update `funding-policy.test.ts` to check that sponsorship is open and donations are paused.
- Update the funding-policy rule in `AGENTS.md`, and the Core memory line from "payments and donations paused" to "donations paused; sponsorship and licensing open".
