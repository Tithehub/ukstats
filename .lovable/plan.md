# UKStats to the top: best UK stats site, then the best global one

ukstats.co.uk stays the main address. stats.solutions becomes the world version. Local business sponsorship works the same way in every country.

## Phase 1: Go live properly (this week)
1. **Publish everything that's waiting**: the slogan, the dedication and navy colours, safest places, the funding pause and legal notice, the speed work and the stats.solutions world home page.
2. **Domains**: once you've chosen "Unset as primary" on ukstats.co.uk, I check that both addresses open on their own name and send Google to the right one.
3. **Google Search Console** for both addresses, with each sitemap submitted.

## Phase 2: Number one for UK statistics
4. **Faster live site.** The live home page takes about 2.6 seconds against 0.8 in preview. I'll finish the planned speed fixes: smaller first load, cached UK figures, and crime files prepared overnight instead of while someone waits. Target: under 1 second.
5. **A page for every figure that Google can find.** Each figure gets a clear page with the plain-English question it answers ("What is UK inflation right now?"), the figure, its source, its date and its next release. This answers the most common searches directly.
6. **Local area pages.** Use the official council and police-area figures we already pull (crime rates by area, house prices by region) to build "your area" pages. Local pages are where local sponsors fit naturally.
7. **Release-day alerts.** Anyone can follow a figure by email or RSS and hear the moment it updates.

## Phase 3: Best global statistics site (stats.solutions)
8. **More countries and measures.** Add the official world sources that publish real feeds: the World Bank, IMF, OECD and UN data portals. These would reach about 190 countries for core measures (population, GDP, inflation, debt, unemployment). Every figure keeps its source, age and next release. Countries without a feed show "No live feed", never an estimate.
9. **Country pages to UK standard** for every new country, with links to the official publisher directory.
10. **World comparisons and rankings**: compare any country on any measure using the same official source only, so the numbers are like-for-like.

## Phase 4: Local sponsorship everywhere (switched off until the legal hold ends)
11. **Sponsors pick a city or area**, not just a country or region. Their banner shows on that area's pages (for example a Manchester estate agent on Manchester pages). Equal turns, and never beside figures, in embeds or on share images.
12. **Prices in local currency** (GBP, EUR, USD and so on), at the same price levels: £5/£50 Supporter and £10/£100 Sponsor.
13. **The sponsor dashboard** works on both addresses, and approval in /agents works as it does now.
14. Everything is built now but stays paused under the current legal notice. Turning it back on is one switch.

## What stays the same
- No invented, estimated or filled-in figures, ever.
- The funding pause, the legal statement and the hidden crypto addresses stay in place until you say otherwise.
- Nothing gets published or posted without your say-so.

## Technical details
- Speed: split getUkStats and store the payload; run recordedCrime prep as a cron job; keep server functions POST.
- New world sources go in national.server.ts with pure parsers and tests, plus a registry entry in countries.ts. All-or-nothing rules apply.
- Area pages: a new /area/$slug route that reuses the city-crime and Land Registry parsers; it goes in the sitemap per host.
- Sponsor areas: extend the `regions text[]` values with area codes and add expansion in sponsor-regions.ts; add currency to the plan's price lookup in sponsor-plans.ts (Stripe prices are created per currency but not offered while FUNDING_PAUSED).
- Alerts: subscribers table with RLS and an email on metric_changes from the daily sweep.
- Tests for: area sponsor matching, currency price mapping, and the parser for each new source.
