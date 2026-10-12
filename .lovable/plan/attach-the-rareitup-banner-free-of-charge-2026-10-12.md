# Attach the RAREITUP banner free of charge

## What you asked
You want your banner live on the site without paying the extra £5/month to move from Supporter to Sponsor. As the site owner you'll also comp other sponsors later from a list you'll provide.

## Plan
1. Upgrade your existing RAREITUP sponsorship from Supporter to Sponsor plan in the database — no Stripe charge, no new subscription. Your £5/month Supporter payment stays exactly as it is; this only flips which perks your listing gets.
2. Attach your new banner (rareitup-banner-v2.png, 1536×512) to your sponsorship:
   - Check the file from its actual bytes first (3:1 shape, at least 1536×512, PNG, under 2MB) — the same rule every sponsor picture must pass.
   - Upload it to your private sponsor-banners folder.
   - Save it against your approved, active, worldwide sponsorship.
3. Verify in the browser: your banner appears in the rotation on the home page (under the hero) and on country pages (footer band), labelled as a sponsor, with rareitup.com as the link.
4. Publish so it's live on ukstats.co.uk.

## For later: free sponsors list
When you send the list, each one gets the same treatment — a Sponsor-plan row marked paid with no Stripe subscription, their details and banner attached after the same size check. They'll rotate fairly with everyone else.

## Technical details
- Update the `sponsors` row: `plan = 'sponsor'`, keep `paid = true`, `approved = true`, `active = true`, regions unchanged (worldwide).
- Upload via the existing sponsor-banners storage path (private bucket, short-lived display links); set the row's banner path.
- No code changes, no price changes, no Stripe changes.
