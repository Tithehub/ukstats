# Population, migration, heat maps, tax vs welfare, and personnel numbers

Everything below keeps the current dark-first theme with the light toggle, the existing home layout, the top key-indicator grid, the live-feed badge in the header, and the rule that no figure is ever invented. Where a body publishes no machine-readable feed, the card says so plainly and links to the official page and its release dates.

## 1. Demographics and migration

New "Population & migration" category with indicator cards and full published history:

- Total UK population (ONS mid-year estimates, with the long back series on `/history/...`)
- UK-born population and non-UK-born population, plus each as a share of the total, from the ONS "population of the UK by country of birth and nationality" release
- Net migration, long-term immigration and long-term emigration (ONS long-term international migration)
- A "Remigration & historic migration trends" block: emigration and net-migration timelines from ONS, alongside Home Office returns (voluntary and enforced) and the published series' own start dates, so the long-run trend is visible rather than a single year

Population and country-of-birth figures feed the top key-indicator grid as well, so the headline population sits with debt, CPI and the rest.

## 2. Interactive heat maps

A new `/maps` page, linked from the nav and from the crime and housing sections.

- **Crime heat map** — regional and local-authority shading from the published police recorded-crime tables, and when you search a postcode or zoom in, the actual street-level crime points from the Police.uk API for the latest published month, with the offence category and month labelled.
- **All-stats geographic map** — the same base map with a layer switcher across house prices (Land Registry by local authority), population and country of birth, crime rates, and other regional series that publish at that geography. One legend per layer, using each publisher's own units, with the source and reference period shown beside the map.
- Both maps read their colours from the theme tokens, so dark and light both work, and every region tooltip carries value, period, source and a link to the official release.

## 3. Total tax vs total welfare

A comparison chart on a `/tax-vs-welfare` page (and a summary card in Finance) plotting total public sector current receipts against the total welfare bill in cash terms, on the longest published run available, with a downloadable table of every observation and direct links to the HMRC/OBR/DWP releases behind each series.

## 4. Defence and security personnel

Added to Defence & security, each with full history:

- UK regular armed forces strength — total plus Army, Royal Navy/Royal Marines and RAF separately (MOD quarterly service personnel statistics)
- Police officer numbers — England and Wales (Home Office police workforce), Police Scotland and PSNI where published, with the per-head rates the publishers give

## Technical notes

- Maps use Leaflet loaded lazily on the client only (no API key, no external map account), with ONS Open Geography boundary GeoJSON simplified and cached server-side; crime points come from the Police.uk street-level API on demand. Wheel/pinch zoom is handled by Leaflet, so no hand-rolled zoom maths.
- New collectors sit in `src/lib/uk-stats.functions.ts` alongside the existing ONS/Home Office ones, reusing the ONS series cache, the request gate and the retry logic. Spreadsheet-only releases (MOD personnel, DWP/OBR welfare, country of birth) are parsed from the published workbook with the existing `fflate` reader; if a release moves or a parse fails, the card shows an explicit unavailable state with the source link rather than a stale or guessed number.
- New routes: `src/routes/maps.tsx`, `src/routes/tax-vs-welfare.tsx`, each with their own head metadata, canonical and og tags, plus sitemap entries. History pages extend to the new series.
- No change to the home page structure: the new cards slot into the existing key-indicator grid and category panels.

## Caveat worth stating up front

Some of these are published only as spreadsheets on a quarterly or annual cycle (MOD personnel, welfare expenditure, country of birth). Those will be as up to date as the publisher's latest release, with the release date and next scheduled release shown — they cannot be more real-time than the source.
