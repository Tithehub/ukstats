# What to do next — order of works

Everything below builds on what already exists. Stats stay free forever; sponsors, renting and PDF reports remain the paid side.

## 1. Get the finished work live (today)
- Publish the waiting changes: Reports page, homepage reports button, Rent screenshots, SEO title rewrites, sitemap additions.
- You buy one real £1 UK report on ukstats.co.uk with your own card and email, then refund it — proves real money flows.

## 2. Make the stream truly 24/7 (biggest visibility win)
- Move streaming off the MacBook onto a small cloud server (about £10–£25/month) running the broadcast page.
- Add a watchdog that restarts the stream if YouTube drops it, and a status light on /live and /globe/studio.
- Stream key kept only on the server, never on the site.
- Needs from you: a cloud server account and YouTube access approval.

## 3. Branded intro and polish for the stream
- Build the approved 6–8 second branded intro (plays on each hour and after the About UKStats break).
- Replace "Test Presenter / Britain Tonight Test" screenshots with a real customer when you have one.

## 4. Finish the Rent service as a sellable product
- Build the streamer backdrop at the agreed prices (£9/month, +£3 per country, all countries +£19, AI presenter +£10, remove sponsor box +£49) with automatic switch-on after payment.
- One full test purchase walkthrough with screenshots.

## 5. Bring in sponsors and report buyers
- A one-page media kit using real, dated audience numbers (site visits, stream views, Google clicks).
- A list of 30 UK businesses to approach, with draft emails you send yourself (posting/outreach stays manual).
- Founding offer: 25% off for the first 10 sponsors within 90 days.

## 6. Grow views
- Share-ready images for each top stat (debt, small boats, prices) to post on X, Bluesky and Mastodon.
- Free embeddable widget promoted to bloggers and local news sites (each embed links back).
- Recheck Google clicks around 21 November and rewrite the next weakest page titles.

## 7. Ongoing tidy-up
- Check every page on phone, tablet and desktop for overlaps or slow loading.
- Fill "No live feed" gaps where an official publisher has since released a machine-readable feed.

## Technical notes
- Stage 2 watchdog: server route under /api/public with a secret check, pg_cron tick, YouTube Live API for broadcast status.
- Stage 4 entitlements reuse the existing Stripe webhook and rent tables.
- Share images generated server-side from cached payloads only — no new figures.
