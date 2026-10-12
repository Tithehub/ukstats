# Take payments live: step-by-step

## What's already done

Your Stripe account is claimed and your business details are submitted. Two steps remain: adding the Lovable app to your **live** account (yours to click), then the automatic checks.

I checked the live site: ukstats.co.uk/advertise returns "page not found" and the live home page has no "Supported by" line. So nothing about sponsorships is public yet — the published site only changes once we ship it.

## You do this (about two minutes)

1. Open the **Payments** tab in the editor and make sure the **Live** toggle is on.
2. On step 3, "Visit Stripe to add the Lovable app on your LIVE Stripe account", click the button there. It opens a Stripe page.
3. On that Stripe page, check the account name in the top-left says your **live** account (not "sandbox" or "test"). If it shows a test account, use the account switcher to pick the live one first.
4. Click **Install** (or **Allow** / **Authorize**) and accept the permissions listed. That's the whole action.
5. Stay on the Payments tab. Step 4, "Create live API keys", completes by itself within about a minute — no action from you.
6. When step 5 unlocks, click the **readiness check**. It tells us whether the live setup is complete.

Tell me when you've clicked Install, or if Stripe shows anything unexpected — a word-for-word line from the page is enough for me to tell you what to do next.

## Then I do this

1. **Confirm the keys arrived.** I re-check the payments status; if step 4 is still stalled after a couple of minutes I investigate rather than leaving you guessing.
2. **Clear anything the readiness check flags.** If it reports the four plans (Supporter £5/£50, Sponsor £10/£100) aren't in the live account yet, I create them there under the same identifiers before publishing.
3. **Publish.** ukstats.co.uk/advertise goes live with the plan cards, the test-mode notice disappears on the published site, and the "Supported by" line appears in the footer everywhere.
4. **Prove it with one real payment.** On the live site: sign in, pay £5 as a Supporter, watch your line land on your admin page marked real and paid, approve it, and see it in the footer. Then cancel with "Manage subscription" and confirm the line disappears. That £5 is yours either way — keep it as your first supporter payment, or refund it from your payments dashboard.
5. **Tidy up.** Mark the go-live item done on the roadmap.

## If Install doesn't take

- Stripe says the app is already installed: nothing to do, I re-check the status.
- The Payments tab still shows step 3 waiting after several minutes: I re-check the status and, if needed, ask you for the exact wording shown so we can tell whether Stripe or Lovable is holding it.
- Readiness check fails: I fix what it names and re-run it before publishing.

## Technical notes

- Status right now: claim and go-live form complete, install step `action_required`, live-key provisioning and readiness check locked until then.
- Live keys and the live webhook secret are written automatically after the app install; no manual keys are involved, and nothing needs pasting into the editor.
- Checkout already reads the caller's environment and looks plans up by lookup key, so no checkout changes are expected — the only likely post-install work is making sure the live account holds the four prices.
- Verified: https://ukstats.co.uk/advertise returns 404 and the live home page contains no sponsor line, so publishing is genuinely still pending.
