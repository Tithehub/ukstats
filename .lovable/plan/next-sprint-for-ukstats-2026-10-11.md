# Next sprint for UKStats

Everything from the last sprint is built and waiting to go live. This plan covers the next highest-impact items that need nothing from you, plus the few that do.

## 1. Publish what's already built (one click)

The live site is missing everything from the last two sprints: /status, /compare, /calendar, /api-docs, /coverage, the production press kit, the armed-forces and census figures, the app icon. Publishing puts all of it live at once.

## 2. Regional dashboards (/regions/$code)

One page per UK nation and English region pulling together everything we already track for that area: crime rates, house prices, population, NHS (Scotland), cost of living. The maps already hold the regional data — this surfaces it as shareable, search-friendly pages. Likely the biggest SEO win available.

## 3. SEO explainer pages

Each major metric gets a plain-English explainer ("What is the UK national debt?", "How is CPI measured?") that ranks in search and funnels to the live figure. Written from the official methodology notes, no invented content.

## 4. Performance and accessibility pass

Lazy-load the heavy charts and maps, audit keyboard navigation and screen-reader labels, contrast checks, bundle-size trim. Makes the site faster on phones and safer for newsroom embeds.

## 5. Full history for non-ONS feeds

Extend Home Office and Land Registry series back as far as their machine-readable data goes, matching what we already did for ONS.

## Waiting on you (not in this sprint)

- **Google Search Console** — needs you to connect your Google account.
- **Email alerts** — needs a sending domain set up on ukstats.co.uk. Say the word and I'll start it.
- **xpre.ai announcement** — must go from a compliant marketing tool, not this app.
- **England NHS figures** — blocked until NHS England allows automated downloads.

## Technical notes

- Regional pages reuse the existing map data loaders and MetricCard; new route `src/routes/regions.$code.tsx` with per-region head() metadata.
- Explainer pages are static content routes under `/explained/$metricId`, linked from each metric card and the sitemap.
- Performance pass: React.lazy behind ClientOnly for Leaflet/chart bundles (already the pattern), plus a Lighthouse-style check via Playwright.
- History extension stays official-source-only; any gap shows "Not published" rather than an estimate.
