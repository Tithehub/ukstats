# Marco's £5 payment and the missing banner upload

## What happened
- Marco's £5 Supporter payment went through on the live site — live payments work.
- He can't find the banner upload because **banners are a Sponsor-plan (£10) perk only**. The £5 Supporter plan is the name-and-link line in the footer. The upload box only appears for Sponsor-plan accounts, so his form correctly shows no upload.

## Plan

### 1. Make the plans clearer on /advertise
- In the "See what you get" example and the plan list, state plainly: banner picture is Sponsor only; Supporter is the text line.
- After a Supporter pays, the details form shows a short note: "Banner pictures come with the Sponsor plan — upgrade any time."

### 2. Marco chooses
- **Stay on Supporter £5:** fill in your name and link, save, and I approve you on /agents — your line appears in the footer.
- **Upgrade to Sponsor £10:** cancel the £5 in Manage subscription, take the Sponsor plan, and the banner upload box appears in your details form.

### 3. Approve and verify
- Once you've saved your details, I approve you on /agents and check your name shows on the pages you chose.

## Technical notes
- No payment or Stripe changes needed — the live checkout is confirmed working by Marco's payment.
- Copy changes only: SponsorPlans.tsx plan perks + post-payment form note.
