# Roadmap

## Town and city crime rankings
- [x] Add country selector and verified Canadian city-area lowest/highest ten lists from the official 2025 Crime Severity Index
- [x] Link rankings from country pages and navigation, explain coverage gaps and validate real-source results
- [x] UK rankings live: ONS Police Force Area Table C4 recorded-crime rates per 1,000 by Community Safety Partnership (England and Wales; Kent unassigned-IT areas and City of London excluded per the publisher's own notes)
- [x] US rankings live: FBI Crime in the United States Table 8, violent crime per 100,000 for cities of 10,000+, limited-data states excluded per FBI footnotes (2025 data)
- [x] Coverage line on /safest-places listing the three connected countries
- [ ] Populate remaining countries (requires verified, comparable town/city datasets; current regional/capital-only feeds cannot establish national city top tens)

## Current usability and speed pass
- [x] Simplify home and navigation around finding, comparing and using official figures
- [x] Improve register search, small-screen controls and loading/error feedback
- [x] Remove avoidable slow requests and verify main journeys at phone, tablet and desktop widths
- [ ] Publish this usability/speed pass and measure live loading (awaiting request to publish)

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
- [x] Phase B: authorised auto-posting via official APIs for accounts the user owns — Bluesky connected and first figure-of-the-day post sent 20:53 UTC; admin gate fixed by granting has_role execute to signed-in users; Mastodon still not connected

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
- [x] Press contact email (admin@xpre.ai)

- [x] Overnight agent team (/agents, nightly 02:00 UK, revisions log on Explained pages)
- [x] Admin-only "Agents" button in the site header and menu drawer (useIsAdmin hook; page gate unchanged)

## Countries expansion
- [x] Wave 1: 30 European countries live from Eurostat (/countries, /fr, /de…, /compare-countries)
- [x] Wave 2: US (Treasury, BLS, NY Fed), Canada (StatCan, Bank of Canada), Australia (ABS), ECB rate for FR/DE/IE; crime/borders/asylum shown as "No live feed" with official links
- [x] Wave 2b (partial): AU CPI and average weekly earnings now live from the ABS; RBA rate, BOM warnings, CBP border and national crime stay "No live feed" (feeds blocked or not machine-readable)
- [x] Country infrastructure: grouped registers, explanations, available published history, embeds, publisher calendar links (exact dates still unconfirmed), JSON/CSV and nightly feed checks for all 33 registered countries
- [x] Broadened verified Eurostat coverage: homicide, asylum decisions, residence permits, debt EUR, practising doctors, health/defence/social protection spending and six cost-of-living inflation series; remaining source gaps explicitly shown
- [x] Published to ukstats.co.uk: all 33 country registers, their embeds and open-data endpoints are live (11 Oct 2026)
- [x] Wave 2c (12 Oct 2026): US federal debt interest rate, core and shelter inflation, FBI violent/property crime with a reporting-lag note, and national weather warnings counted across all 50 states and Washington D.C.; Canada warnings counted from Environment and Climate Change Canada; published to ukstats.co.uk
- [ ] Full UK-equivalent coverage: integrate national feeds for every country (especially US/CA/AU), weather, alerts, polling, immigration costs, publisher-confirmed release dates, deeper explanations and revision history; current infrastructure does not imply complete topic parity

## Social branding
- [x] Solid-white logo versions for Bluesky (profile square + banner) — transparent PNGs render badly there
- [x] Nightly agents extended to the 33 country registers: revision detection (country_metric_snapshots) and a country figure-of-the-day draft
- [x] Marketing posts now carry official figures only — weather-model and warning cards stay on the site but are never drafted as posts
- [x] Page-age labels no longer force a full client re-render (server/client clock mismatch fixed with a wrapped clock text component)
- [x] Publication dates print to the UK day on every page, so the browser no longer rebuilds the home page over a one-day difference

## Open source
- [x] MIT licence, README, CONTRIBUTING (golden rule: never invent a figure), code of conduct, three issue templates
- [x] Repository is public: https://github.com/Tithehub/ukstats — footer link, README clone line and both announcement posts point at it
- [x] Contributor commands fixed: `npm test` and `npm run typecheck` now exist in package.json (the old `npx tsgo` only existed in the sandbox and would fail for anyone else)
- [x] Automated checks on every pull request (.github/workflows/ci.yml): install, typecheck, tests
- [x] Code is live on GitHub — Lovable created the repo and two-way sync is working (12 Oct 2026); .env in repo holds only public publishable keys
- [x] "We're open source" announcements posted to Bluesky and Mastodon (04:46 UTC 12 Oct 2026, verified live on both profiles)

## Global extension
- [x] /global page: 164 national statistics offices beyond the 33 covered, grouped by region (UN directory, links checked 2026-10-12)

## Monetisation
- [x] Add a self-service sponsor dashboard for banner uploads, name and website edits; signed-in RAREITUP upload, invalid-link rejection and saved-details readback verified; unchanged live approval restored after testing.
- [x] Attach GoPharma, XPRE and Gold.live banners; all three pictures and website links verified rotating on live /fr (home-page rotation remained stuck on RAREITUP during verification)
- [x] /advertise sponsor page + footer "Supported by" strip + enquiries
- [x] Sponsor prices set: Supporter £5/month or £50/year, Sponsor £10/month or £100/year (yearly selected by default)
- [ ] Paid API plan (needs payment provider choice)
- [ ] Weekly email briefing
- [x] Paid sponsor plans (Supporter £5/£50, Sponsor £10/£100) with checkout, admin approval, auto-off on cancel
- [x] Sponsor lines render only when paid, approved, switched on and from the visitor's own environment (a test line can't reach the live site)
- [x] Go live with payments: Stripe live account connected, readiness check passed (12 Oct 2026)
- [x] Region-aware sponsor banner with a button at the top of the footer on every page (rotates three at a time every 8s, holds on hover, UK/EU/US/CA/AU regions); /sponsors hub page listing every approved sponsor by region; "See what you get" example box on /advertise using the clearly-labelled made-up estate agent
- [x] Sponsor system published to ukstats.co.uk (12 Oct 2026): banner, /sponsors and live paid plans verified on the live site, no test-mode note
- [ ] Real-money end-to-end test: pay £5, approve on /agents, confirm the "Supported by" line appears
- [x] Sponsor banner uploads: the sponsor picks a picture, checked from the file bytes (3 wide to 1 tall, at least 1536×512, jpg/png/webp, under 2MB) both in the browser and on the server; private picture folder with short-lived links; the banner keeps one true 3:1 shape at every screen size so nothing is cropped; your admin list shows the picture
- [ ] Publish the sponsor banner upload work
- [ ] Real sponsor pictures going through the live approval flow (banner still shows the example estate agent)
- [x] Home-page sponsor banner rotation fixed (12 Oct 2026): home now reads its data from the page itself instead of re-asking the server in the browser; live home verified rotating RAREITUP → Gold.live → XPRE → YachtFino → GoPharma every 8s with no errors
