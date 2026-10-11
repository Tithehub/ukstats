# Roadmap

- [x] SEO: og:url/canonical, headings, sitemap.xml + robots.txt
- [x] Remove the "Edit with Lovable" badge from the published site
- [x] Crime: all published offence groups + per-population rates (ONS/Home Office PFA tables)
- [x] Simplified dark home page + full register on /register, site-wide theme + light/dark toggle
- [x] Full published history per ONS metric (/history/$metricId): 1Y/5Y/10Y/Max chart, every observation, CSV
- [x] Cost of living grouped: shopping, energy & fuel, council tax, telephone & internet, water & sewerage, house prices, travel, rents, wages
- [x] Vital signs strip pinned at the top of / and /register
- [x] Share to all major socials with real official source links
- [x] /support donation page (crypto addresses pending from the user)
- [x] Population & migration: UK population, LTIM immigration/emigration/net (incl. British nationals), history
- [x] Heat maps at /maps: police force area crime + regional house prices, postcode street-level Police.uk pins
- [x] /tax-vs-welfare: total current receipts vs net social benefits, full published history + CSV
- [x] Defence & security / Crime personnel: HM Forces FTE and police workforce (ONS public sector employment)
- [x] Army/Navy/RAF split (MOD quarterly tables, history since 2012) and UK-born/non-UK-born (Census 2021 TS004, England & Wales)
- [x] Add the real MetaMask/crypto addresses to src/lib/donate.ts once provided
- [ ] Google Search Console setup (needs user to connect the account)

## Ideas for next
- [x] Compare mode (/compare: two metrics on one indexed chart)
- [x] Release calendar (/calendar: announced next-release dates)
- [x] Feed health monitor (/status) + feed_checks log written by the daily sweep
- [x] Sweep hardening: London-day boundary fix; cron verified running daily 06:30 UTC
- [x] Security pass: public logs locked behind controlled read functions; scan clean
- [x] Public JSON/CSV API (/api/public/v1/metrics, docs at /api-docs)
- [x] Installable app icon + favicon
- [x] Regional dashboards (/regions + /regions/$slug for all 12 UK nations/regions)
- [x] SEO explainer pages (/explained/$metricId for the 10 most-asked-about figures)
- [x] Full UK house price history back to Jan 2005 (HM Land Registry UK HPI)
- [ ] Full history for Home Office feeds where machine-readable

## NHS & doctors
- [x] "NHS & doctors" category on the home page and register
- [x] Live Scottish figures (A&E 4-hour, cancer 62-day, inpatient/day-case and outpatient waiting lists) from Public Health Scotland open data
- [x] England/UK cards (HCHS doctors, GPs, RTT list, A&E, GMC IMG share, vacancies, cancer 62-day, ambulance Cat 2, bed occupancy) shown as "No live feed" with the official release link
- [ ] Fill the England cards if NHS England / NHS Digital / GMC ever serve machine-readable data to automated clients

## Outreach agent
- [x] /outreach queue: platform-ready drafts (X, Bluesky, LinkedIn, Facebook, Threads, Reddit, Mastodon) built only from published figures
- [x] Daily "UK by the numbers" digest draft from the vital signs
- [x] Change tracking: metric_snapshots + public metric_changes, swept by POST /api/public/outreach-tick (cron secret)
- [x] /feed.xml RSS of newly published figures, linked from every page head
- [ ] Phase B: authorised auto-posting via official APIs for accounts the user owns

## Free site + accounts
- [x] All paid tiers, crypto checkout and payment_orders removed — every feature, live page and widget is free
- [x] Live pages default to a 12-month window with a one-tap "Keep it live" renewal
- [x] Accounts: /auth (email+password, Google, forgot password) and /reset-password
- [x] profiles + user_roles + has_role(); anonymous pages claimed onto the account on sign-in
- [x] Donations stay voluntary on /support (ETH, BTC, Solana, Tron)
- [ ] Announcement to the xpre.ai audience: send from a compliant marketing tool, not this app
- [x] Anyone can use the outreach bot: /connections attaches their own Bluesky, Mastodon, Telegram, Discord or Slack account and the queue posts in one tap (credentials stay server-side)

## Press
- [x] /press press kit: mission, citation formats, data sources, media kit
- [ ] Press contact email (needs user)
