# UK foreign aid spend, every published year

Add total UK overseas aid (Official Development Assistance) as a live, source-linked series with the full published history, matching the site's existing rules: real published figures only, with source, reference period, data age and next release shown.

## What gets added

**Finance section cards (home and `/register`)**
- Total UK foreign aid spend, latest published year, in cash £ millions
- UK aid as a share of national income (the ODA:GNI ratio the publishers report against the 0.7% commitment)
- Both cards link straight to the official releases and carry the reference year, publication date and next scheduled release.

**New page `/foreign-aid`**
- Year-by-year chart of total UK ODA in cash £ from the first published year (1960) to the latest year on record (currently 2025), the same dark/light chart treatment used on the tax vs welfare page.
- A second toggle showing aid as a percentage of national income across the same years, so the 0.7% commitment period is visible against the long run.
- Full year-by-year table beneath the chart: year, aid spend (£m), share of national income, and a note on which measurement basis the publisher used for that year.
- CSV download of every observation, official source links, and the standard share row.
- Coverage note stating plainly that the basis changed in 2018 — earlier years are published as net disbursements, later years on the grant-equivalent basis the DAC now uses — so the series is the publisher's own and is not spliced or adjusted here.

**History page** — the aid metrics also get `/history/...` entries like every other metric.

## Sources

- OECD DAC Table DAC1 (the official international reporting of UK ODA, sourced from the UK government's own returns), which publishes the UK series in national currency back to 1960 and includes the ODA/GNI ratio.
- FCDO/ONS "Statistics on International Development" — the UK's own annual publication, linked on every card and on the page, with its publication and next-release dates.

## Technical notes

- New collector `getForeignAid` in `src/lib/uk-stats.functions.ts` reads the OECD SDMX CSV endpoint for donor GBR, DAC1 total ODA in national currency plus the ODA/GNI percentage, reusing the existing fetch cache, request gate and retry/backoff. Verified working: returns 1960–2025, e.g. 1960 £144.9m, 2024 £14,082.2m, 2025 £13,036.4m.
- New route `src/routes/foreign-aid.tsx` with its own head metadata, canonical and og tags; added to the header nav and `sitemap.xml`.
- Metrics register under the existing `Finance` category so the home layout and key-indicator grid are unchanged in structure.
- If the feed fails, the cards and page show the explicit "No live feed" state with source links and release dates — no estimated or carried-forward numbers.
