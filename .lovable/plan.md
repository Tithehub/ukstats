# Happiest and saddest countries

Extend /happiest-places with a "Countries" view using the same Top 10 happiest / Top 10 saddest layout, search, filter and sort as the UK list.

## What visitors see
- A UK places / Countries switch at the top of the Happiest places page (shareable in the link).
- **Official list** (first): life satisfaction out of 10 from OECD (How's Life / Better Life) and Eurostat (EU-SILC overall life satisfaction). Each country shows the publisher, survey year and source link. Where both publish a figure, both are shown side by side, never averaged.
- **Research list** (separate panel, clearly labelled "Research — not an official statistic"): World Happiness Report Cantril ladder scores (Gallup World Poll), ~140 countries, with its 3-year average period.
- Top 10 happiest and saddest per list, then the full list with search, region filter and sort.
- UK highlighted in each list; countries with no figure say "Not published".
- Country rows link to the existing country page where one exists.
- Linked from the menu, topic bar and home page.

## Rules
- Lists never merged into one ranking; figures more than 3 years behind the newest in that list are shown but unranked (matches world rankings rule).
- Nothing estimated or filled in.

## Technical details
- Pure parsers + ranking in src/lib/world-wellbeing.ts (reuse rankByMeasure pattern), network in world-wellbeing.server.ts, cached as payload_cache "world-wellbeing-v1" with lastGood fallback; POST server function + shared query options.
- Sources: OECD SDMX API, Eurostat ilc_pw01 via existing eurostat helpers, WHR published data file (dated snapshot if no stable feed).
- Nightly refresh via a cron-authenticated /api/public route.
- Tests: no merging, stale entries unranked, missing shows Not published, tie handling.
- Update head metadata and sitemap.
