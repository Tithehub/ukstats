# Expand UK Stats to Europe and the Western world

Goal: the same register you have for the UK (official source, reference period, data age, next release, "No live feed" when nothing official exists) for other countries, each in its own section — ukstats.co.uk/us, /fr, /de and so on. The UK site at "/" stays exactly as it is.

Same rule everywhere: only figures from each country's official bodies. Nothing estimated, translated into guesses or filled in.

## Wave 1 — All of Europe via Eurostat (one source, 27 EU countries + Norway, Iceland, Switzerland)
Each country page gets the comparable Eurostat set, every card credited "Eurostat" with the national office named:
- Inflation (HICP), unemployment, GDP growth, government debt (% of GDP and euros), deficit
- House price index, minimum wage, population
- Asylum applications and first-instance decisions, residence permits issued
- Recorded crime (Eurostat crime tables — yearly, often 1–2 years old; age shown honestly)
- Central bank rate: ECB for euro countries, national bank where published

## Wave 2 — Deep pages for the big Western countries (national sources, close to the UK depth)
- USA: BLS (inflation, jobs), BEA (GDP), US Treasury (total debt, daily), FBI crime data, CBP southwest border encounters, DHS immigration, Federal Reserve rate
- France: INSEE, Banque de France, Ministère de l'Intérieur (asylum, crime), Agence France Trésor (debt)
- Germany: Destatis, Bundesbank, BAMF (asylum), BKA crime statistics
- Ireland: CSO, Central Bank of Ireland, Department of Justice
- Canada: Statistics Canada, Bank of Canada, IRCC (immigration)
- Australia: ABS, Reserve Bank of Australia, Home Affairs (including boat arrivals where published)
- Wave 3 later: Italy, Spain, Netherlands, Sweden, Poland, New Zealand

Where a topic exists in the UK but a country publishes nothing official (e.g. small-boat arrivals, terror threat level), that card shows "No live feed" with the nearest official link.

## What you will see
- A country switcher in the top bar and a new "Countries" page listing every country with how many live figures it has
- Each country section: its own register, calendar of next releases, Explained pages, history, embeds and open-data API (e.g. /api for ?country=fr)
- A new "Compare countries" view: one figure (say inflation or debt) side by side across countries, only where the definitions match (Eurostat-harmonised), with a note when they don't
- Sitemap, Dataset tags and page titles per country so each one can be found in search
- The overnight agent team watches the new feeds too; the Marketing agent can draft "figure of the day" posts per country (still approval-only)

## Order of work
1. Make the site country-aware without changing the UK pages
2. Eurostat collector → all European country pages go live
3. Countries page, switcher, compare view, sitemap/API updates
4. USA, then France, Germany, Ireland, Canada, Australia, one at a time, each checked against the publisher before it ships
5. Extend agents (watchdog, auditor, marketing) to every country

Each country is checked live against its publisher before publishing; anything that can't be verified ships as "No live feed".

## Technical details
- Add `country` (ISO code) to Metric and payload; current collector becomes the `gb` collector, untouched in behaviour.
- New `src/lib/countries/` registry: per-country config (name, flag, currency, publishers, collector).
- Collectors server-only per source: `eurostat.server.ts` (JSON-stat API, dataset codes prc_hicp_manr, une_rt_m, gov_10q_ggdebt, namq_10_gdp, prc_hpi_q, migr_asyappctzm, crim_off_cat, tps00001), then `us.server.ts`, `fr.server.ts`, etc.
- Per-country persisted snapshot rows (same fallback mechanism as UK) keyed by country so pages stay fast.
- Routes: `src/routes/$country.tsx` layout + `$country.index.tsx`, `$country.calendar.tsx`, `$country.explained.$metricId.tsx`, `$country.history.$metricId.tsx`; `countries.tsx`; `compare-countries.tsx`. Unknown codes → notFound. Existing UK routes unchanged.
- Currency formatting per country (EUR, USD, CAD, AUD, CHF, etc.).
- Tests: country registry codes resolve, Eurostat parser returns null (not a number) for missing values, compare view refuses mismatched definitions.
