# Make the home-page sponsor banner rotate through all sponsors

## What's happening now

The banner already has rotation built in: every 8 seconds it should move to the next sponsor, giving everyone equal turns, pausing when you hover. On country pages (like /fr) this works — all five banners take turns.

On the home page it stays stuck on RAREITUP. The likely cause is the known home-page problem: the page's interactive layer sometimes fails to start on the live site, and without it the timer that moves the banner on never runs. The banner you see is just the frozen first picture.

## The plan

1. **Find what stops the home page waking up.** Open the live home page in a test browser and record the errors it reports. This will name the exact piece that breaks.
2. **Fix that piece** so the home page starts up cleanly every visit.
3. **Prove the rotation works.** In the test browser, watch the home-page banner move through all five sponsors — RAREITUP, GoPharma, XPRE, Gold.live and YachtFino — each with its own picture and "Visit" button, pausing on hover.
4. **Publish** and repeat the same check on ukstats.co.uk so you can see it yourself.

## Technical details (for reference)

- The rotation itself (8-second timer, fair random starting order, hover pause) already exists in the SponsorBanner component and needs no changes.
- The fix targets whatever throws during the home page's hydration (the step where the server-rendered page becomes interactive). A likely suspect is code that touches browser-only information while the page is being put together.
- No changes to prices, Stripe, sponsor approvals, or the country-page banners.
