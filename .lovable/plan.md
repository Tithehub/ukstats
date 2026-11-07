# Order of works

Three phases, done in order. Each phase ends with a check you can see before the next starts.

## Phase 1 — Live stream that never stops (24/7)

1. **Cloud streaming server** (replaces the MacBook/OBS). A small always-on server (about £10–£25/month, your account) opens the broadcast page and streams it to YouTube around the clock. The stream key is stored only on that server, never on the site.
2. **Auto-restart watchdog.** Every 5 minutes an overnight agent checks whether the YouTube stream is live. If it has stopped or been cut off, it tells the server to restart and reconnect, and logs what happened on the Agents page.
3. **YouTube settings** you set once: a permanent stream key, "Auto-start" on and "Auto-stop" off, so restarts reuse the same live link.
4. **Always playing on ukstats.co.uk.** The homepage player starts muted automatically (browsers block sound until you tap), with a "Tap for sound" button. If YouTube is down it shows "Back shortly" plus the last check time, not an error.
5. **Share the live stream.** Share buttons by the player and on a new /live page: X, Facebook, WhatsApp, Bluesky, Telegram, LinkedIn, Reddit, email and copy link. Links point to ukstats.co.uk/live (tagged so we can count each platform), with a proper preview picture.
6. **Status on /globe/studio:** live/offline, uptime, last restart.

Check: stop the stream on purpose, confirm it comes back by itself within ~10 minutes.

## Phase 2 — Rent / licence UKStats as a real paid service

1. **Customer accounts:** sign up/sign in (email + Google) and a "My licence" dashboard.
2. **Checkout** using the current low prices (£9/month backdrop, +£3 per country, all countries +£19, AI presenter +£10, sponsor-box removal +£49), as monthly subscriptions sold as digital goods.
3. **Their branded product, made automatically after payment:**
   - branded stream backdrop link (their logo, colours and chosen layout and countries), for their own OBS
   - branded embeddable widgets and dashboard page
   - AI presenter, or self-presenter mode with an autocue
4. **Figures stay locked:** customers can change branding only. Source, date, age and next release always show.
5. **Billing self-service:** upgrade, cancel and invoices. If payment fails, the backdrop pauses with a notice.
6. Donations stay paused and crypto stays hidden.

Check: buy a test licence from start to finish and see the branded backdrop working.

## Phase 3 — Get major views

1. **Fixes first:** run an SEO scan and fix titles, descriptions, preview pictures, sitemap and broken links. Set up Google Search Console.
2. **Shareable stat cards:** every major figure (debt, small boats, warnings) gets a share picture and a short link.
3. **Daily social pack:** an agent drafts the day's posts from new official releases for X, Bluesky and Mastodon. You approve and post them yourself (posting stays manual).
4. **Outreach:** a list of UK journalists, Substack writers, podcasters and communities that cover debt, migration and crime, with short personal messages you send. Plus a press page with embed instructions.
5. **Embeds for other sites:** promote the free widget to bloggers and local news sites. Every embed links back to UKStats.
6. **Sponsor sales pack:** a media kit with dated audience numbers, sent to 30 UK businesses to fill the £299/£99/£49 slots.
7. **Optional later:** small Google/Meta ad tests on "UK national debt" and "small boats today" searches.

Check: weekly visitor and stream-view numbers from analytics, compared with the week before.

## Needs from you
- A cloud server account (I'll recommend one and walk you through it) and your YouTube stream key, entered only on that server.
- Approval of each phase before it goes live.

## Technical notes
- Watchdog: scheduled HTTP job → /api/public/stream-watchdog route (cron-auth) → YouTube Data API liveBroadcasts status (YOUTUBE_API_KEY / OAuth) → server restart webhook protected by a shared secret.
- Server: headless Chromium + ffmpeg (or OBS headless) under systemd, with Restart=always.
- Licences: licences table with RLS by user_id; branding config read by /globe/broadcast?licence=…; Stripe subscription webhooks set active/paused.
