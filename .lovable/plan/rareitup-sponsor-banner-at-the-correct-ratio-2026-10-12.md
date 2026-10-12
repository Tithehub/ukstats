# RAREITUP sponsor banner at the correct ratio

## What we'll do

1. **Re-frame the uploaded card-pack image into a wide banner.** The uploaded picture is tall (portrait). We'll extend the dark purple lightning scene sideways and place the RAREITUP pack to one side, producing a true 3:1 banner at 1536×512 — the exact size sponsor banners require. Only text already on the pack (RAREITUP, Neon Series 1, 8 Cards, Founder Edition) stays; the only addition is a small "rareitup.com" web address, matching the link Marco already saved.
2. **Check the result at full size** — no cut-off text, no stretched pack, correct 3:1 shape.
3. **Save it as Marco's sponsor banner** in his private banner folder and attach it to his approved RAREITUP sponsor line, so it starts rotating in the banner spots (under the home-page hero and in the footer band on other pages).

## One thing to know

Marco's current paid plan is **Supporter (£5/month)**, which is the text line only — banner pictures are a **Sponsor plan (£10/month)** perk. Two options:

- **A. Attach the banner anyway** as a one-off goodwill gesture for the first real customer, or
- **B. Make the banner now and hold it** until he upgrades to the Sponsor plan from "Manage subscription" on /advertise.

Default if he doesn't say: **B** — make the banner, attach it once he upgrades, so the plan rules stay honest for future sponsors.

## Technical details

- Use imagegen--edit_image with the uploaded image as the source, output 1536×512, saved under src/assets for inspection, then uploaded to the private sponsor-banners folder in his own folder via the existing upload path.
- The server-side check (3:1, min 1536×512, ≤2MB, bytes inspected) will validate the final file before it's saved to his sponsor row.
- No changes to prices, plans, or the sponsor rotation logic.
