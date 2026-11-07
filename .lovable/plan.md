# Daily UKStats PDF reports (paid downloads)

## What people get
- **Daily UK report**: £1 per day's report.
- **Daily Global report** (UK and every country we cover): £2.50 per day's report.
- **Subscriptions**, priced as a discount on the daily prices. They unlock every daily report, plus weekly and monthly summary PDFs:
  - UK monthly £19.99 (instead of about £30), UK yearly £199 (instead of £365)
  - Global monthly £49.99 (instead of about £75), Global yearly £499 (instead of £912)
- The stats on the site stay free forever. People pay for the polished, ready-to-share PDF, not for the figures.

## The report (hyper-professional, UKStats branded)
- Cover page: UKStats logo, navy #051D3F, report date, "Official figures only", and a QR code to ukstats.co.uk.
- Headline page: national debt, small boats and irregular migration, inflation, unemployment, and active weather and terror warnings.
- One section per topic: crime, finance, cost of living, immigration, housing and the rest. Every figure shows its source, period, data age, next release and year-on-year change, but only when the publisher gives one.
- Global edition: a Top 5 page for each country, plus world rankings.
- A "Not published" mark wherever a figure is missing, so nothing is estimated. The final page lists every source, with page numbers and footer branding throughout.
- Fonts are Archivo and IBM Plex Mono, matching the site.

## Where people find it
- A new **Reports** page with a sample preview, prices, a buy button and an archive of past days.
- Links from the menu, the topic bar, the homepage, the Rent page and the livestream QR or about break.
- A **My reports** area for buyers, where they can download and manage their subscription.

## How it works
- Every morning at 07:00 London time, today's UK and Global reports are built from the same saved figures the site shows, then stored privately.
- When someone buys one, the download unlocks straight away. Subscribers can download any day while their subscription is active.
- Downloads use short-lived private links, so a paid PDF can't be shared by link.

## Test
Buy a £1 UK report and a Global monthly subscription in test mode, then download both PDFs. I'll check every page of each PDF for layout and look for cut-off text, and send you screenshots.

## Technical details
- Stripe products: `report_uk_daily` (£1 one-off), `report_global_daily` (£2.50 one-off), `report_uk_monthly`, `report_uk_yearly`, `report_global_monthly` and `report_global_yearly`, all as digital goods (txcd_10000000). Checkout is embedded, and the existing webhook gets a branch for `kind=report`.
- Tables: `report_editions` (date, edition, storage path) and `report_entitlements` (user, edition, date or subscription period), with row-level security limited to the owner.
- PDFs are generated with pdf-lib on the server, from `payload_cache` snapshots only. A scheduled job calls `/api/public/reports-tick`, which checks a secret. Files go to a private `reports` bucket and are served through signed links that last 60 seconds.
- Tests cover prices, which reports an entitlement unlocks (a day, or a subscription window), and the rule that no snapshot means "Not published".
