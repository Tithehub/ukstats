# Take sponsorships live

## Where it stands

I checked your payments setup. Two of five steps are finished (your Stripe account is claimed and your business details are submitted). One step is still yours to do in Stripe: adding the Lovable app to your **live** account. Once that's done, live payment keys are created automatically and a final readiness check runs.

I also checked the site's own rules and found one gap worth closing before real money arrives:

- **Good:** only sponsor lines that are paid, approved and switched on can be read by visitors, and your database currently holds no sponsor lines at all.
- **Gap:** the footer "Supported by" line does not distinguish test-mode lines from real ones. Test and real sponsorships live in the same database. So if you approve your test line (as I suggested earlier), that line would appear on the live ukstats.co.uk footer. Same for any future test you run.

## What I'll do

1. **Fix the leak (preview only, no risk).** The footer will only show sponsor lines from the same environment the visitor is on — real lines on ukstats.co.uk, test lines in the preview. If payments are ever switched off, the footer will simply show the "Sponsor UKStats" invitation rather than breaking the page. A small check goes in beside the existing ones so this can't quietly come back.

2. **You finish in Stripe.** Payments tab, step 3: add the Lovable app to your live account. Steps 4 and 5 follow on their own — live keys appear, then you run the readiness check in the same tab.

3. **Publish once live keys exist.** Publishing before then would keep the published site in test mode. On publish, your four plans (Supporter £5/£50, Sponsor £10/£100) copy across to the live account automatically, keeping the same identifiers.

4. **Verify with one real payment.** On the live site: sign in, pay £5 as a Supporter, confirm your line lands on your admin page marked real and paid, approve it, and see it in the footer. Then cancel with "Manage subscription" and confirm the line disappears. That £5 is yours either way — keep it as a first supporter payment, or refund it from your payments dashboard.

5. **Tidy up.** Mark the go-live item done on the roadmap and note the approval rules where the rest of the sponsorship rules live.

## Still open for you to decide

The Sponsor plan currently gets a tagline and top spot in the footer line, not a card on a topic page — I dropped topic pages earlier because they sit right beside the figures. Say the word if you'd like them back.

## Technical notes

- `src/components/SponsorStrip.tsx` queries `sponsors` with no `environment` filter; row-level security (`active AND approved AND paid`) doesn't filter environment either, so the fix belongs in the component.
- `getStripeEnvironment()` in `src/lib/stripe.ts` throws when no payments token is present, so the strip needs a guarded call — the footer renders on every page.
- Filter logic moves to a small pure helper with a test asserting a `sandbox` row is hidden on `live` and an unapproved row is hidden everywhere.
- Checkout already reads the caller's environment and looks prices up by lookup key, so no checkout changes are expected; if the readiness check reports missing live plans, that gets fixed before publishing.
- Verified state: go-live steps 1-2 complete, step 3 `action_required`, steps 4-5 locked; `sponsors`, `subscriptions` and `sponsor_enquiries` all have row-level security on; `sponsors` is empty.
