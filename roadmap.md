# Roadmap

## Approved morning improvements
- [ ] Restore weather-health access with bounded retries and verified failure behaviour
- [ ] Verify religion/ethnicity remain unpublished, never inferred or counted as outages
- [ ] Prepare the official-source country coverage shortlist
- [ ] Check and submit the sitemap through the connected Google account (subject to verified property access)
- [ ] Review the ten social drafts and two explainers; publication waits for Marco's individual decisions
- [ ] Build three evidenced answer pages (blocked until reader questions or Search Console topics are available)
- [ ] Add a focused two/three-country comparison with dates, sources and incompatibility flags
- [ ] Measure repeat visits and implement evidence-backed speed improvements
- [ ] Verify and request publishing to ukstats.co.uk

## Political party comparison
- [x] Build /parties with official 2024 seat/vote rankings, individual-poll comparisons and verified historical manifesto summaries
- [x] Verify comparison controls, unavailable polling, URL restoration and small-screen layout; five tests pass
- [ ] Complete SNP/Plaid policy summaries (blocked: full primary manifesto text could not be retrieved; links and explicit unavailable states retained)
- [x] Party page published to ukstats.co.uk (18 Oct 2026)

## X (Twitter) account
- [x] Add the site's X, Bluesky and Mastodon profile links to the footer (social-profiles module + tests)
- [ ] Marco creates @ukstats on x.com, then verify the handle resolves and the footer link works (blocked on Marco)

## Temporary funding pause
- [x] Add Marco's whole-site donation message and verify every crypto address, QR code and donation control is hidden (browser verified; both policy tests passed)
- [x] Block new checkout and hide donation options without deleting their setup; keep existing sponsor editing and subscription management
- [x] Verify paused payment and donation pages (policy test passed; both pages checked in browser; build OK)
- [x] Add the legal statement that donations and sponsorships are on hold until the full legal due diligence process is completed and the site stays completely free (policy test added; shown in the footer dedication on every page plus /support, /advertise, /sponsors and the sponsor dashboard)
- [x] Funding pause and legal statement published to ukstats.co.uk (18 Oct 2026)

## Restore Britain dedication and colours
- [x] Add the uploaded logo and independent dedication to the shared footer, retaining donations and local-business sponsorship
- [x] Apply the logo's navy palette to light and dark themes and verify layouts and links
- [x] Dedication and navy colours published to ukstats.co.uk (18 Oct 2026)

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
- [x] Usability/speed pass published to ukstats.co.uk (18 Oct 2026); re-measure live loading

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
- [x] Sponsor banner upload work published to ukstats.co.uk (18 Oct 2026)
- [ ] Real sponsor pictures going through the live approval flow (banner still shows the example estate agent)
- [x] Home-page sponsor banner rotation fixed (12 Oct 2026): home now reads its data from the page itself instead of re-asking the server in the browser; live home verified rotating RAREITUP → Gold.live → XPRE → YachtFino → GoPharma every 8s with no errors

## Trust and visitors (17 Oct 2026)
- [x] Feed health page (/status) confirmed live in nav and sitemap; shows last check and 30-day reliability per feed
- [x] Daily sweep fixed: it had not run since 11 Oct — new schedule "ukstats-daily-sweep" (06:30 daily) now calls the sweep that logs feed checks, snapshots and the daily statement
- [x] Fresh security scan: no issues found
- [x] History pages added to the sitemap (they carry the Dataset markup Google Dataset Search reads)
- [x] "Embed this figure" button on every history page, linking to the embed builder
- [x] Outreach drafts saved (Show HN post, awesome-public-datasets listing, daily social posts, newsletter pitches) — Marco sends these himself
- [ ] Submit the sitemap in Google Search Console (needs Marco's Google account)
- [x] Everything waiting published to ukstats.co.uk (18 Oct 2026): slogan, dedication, safest places, funding pause, world rankings, small boats, speed fix

## stats.solutions global door
- [x] Host-aware brand, world-first home, per-host sitemap/robots, world canonicals
- [ ] Connect stats.solutions DNS (waiting on Marco at his provider)
- [ ] Unset ukstats.co.uk as primary so both addresses serve (Marco, Project Settings)
- [x] Global-door code published (18 Oct 2026); stats.solutions still forwards until ukstats.co.uk is unset as primary

## World-class UK + global plan (18 Oct 2026)
- [x] Phase 1: publish waiting work
- [ ] Phase 1: unset ukstats.co.uk as primary (Marco, in Domains settings) — blocks stats.solutions showing its own name
- [ ] Phase 1: Search Console for both domains (needs Marco's Google account)
- [ ] Phase 2: live speed under 1s; per-figure question pages; local area pages; release alerts
- [x] Phase 3 (part): World Bank world rankings live at /world with a page per country (18 Oct 2026)
- [ ] Phase 3: IMF/OECD/UN sources; country pages raised to UK standard
- [ ] Phase 4: city/area sponsor targeting, local currency prices (stays paused under legal hold)

## Small boats depth (vs Small Boat Watch)
- [x] Every day since 2018 at /small-boats, with chart, yearly totals and CSV
- [x] Totals under each Prime Minister (official figures only, no cost estimates)
- [x] Phone "add to home screen" prompt
- [ ] Daily small boats email alert — waiting on an email sender address being set up

## World rankings (18 Oct 2026)
- [x] Six World Bank figures (population, GDP, GDP per person, inflation, government debt, homicide) ranked across 200+ countries at /world
- [x] A page per country at /world/XX with every figure, its rank, year and source links; UK points to the register
- [x] Filings more than three years behind the newest are listed but never ranked; no figure is estimated
- [x] Published to ukstats.co.uk (18 Oct 2026)
- [ ] Re-check live /world loading and confirm Search Console sees the new pages
