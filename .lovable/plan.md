# Official agencies per country + Gold reserves page

## 1. Every official source, per country, per UK category

Each country's Sources page (/$country/sources) gets a full directory grouped by the same 12 categories as the UK:

Finance, Cost of living, Crime, Population & migration, Immigration, Irregular immigration & cost, Housing, Weather, Defence & security, National alerts, Health (the NHS equivalent), Politics & elections.

For each country and category: the government body that publishes the official figure (name, link, what it publishes), for example Germany, Crime: Bundeskriminalamt (BKA), Police Crime Statistics; Weather: Deutscher Wetterdienst; Health: Destatis / Robert Koch Institut.

- Each body is marked **live on UKStats** when we already pull its figures, or **source only** when we just link it.
- If a country has no official publisher for a category (for example, no national irregular-migration count), it says so plainly. Nothing is guessed.
- Every link is checked to open before it is listed, and broken ones are left out.
- A new all-countries page, /sources, lets people compare who publishes what across all 33 countries.

## 2. Physical gold page (/gold)

- A ranking of countries by official gold reserves in tonnes, with the latest month, data age and next update for each. Countries we cover are highlighted and linked.
- Source: IMF International Reserves data (official central-bank reporting), shown with its link and reference period. If the IMF feed doesn't answer, the page shows "No live feed" rather than older or estimated numbers.
- The World Gold Council's ranking is linked as a secondary reference only (it is not a government body).
- Gold also appears on each covered country's page and is added to the menu, sitemap and API.

## Technical details
- New `src/lib/agencies.ts` with a per-country registry `{ category, name, url, publishes, live }`. The Sources route renders it, and `/sources` gives the cross-country matrix. A test checks that every country has an entry for every category (either a body or an explicit "none").
- URL check script (HEAD/GET) is run before saving; anything other than 2xx/3xx is dropped.
- Gold: IMF SDMX `IRFCL` dataflow (official reserve assets: gold volume in fine troy ounces, converted to tonnes at 32,150.7466 oz/t). The exact series code is checked against the IMF dataflow structure before use. A pure parser goes in `src/lib/national.ts` with a test; fetching goes in `national.server.ts` with a 24h cache, and countries that don't report are left out rather than estimated. Route `src/routes/gold.tsx` with its own head(), plus `/api/public/v1/gold`.
- Update AGENTS.md (agency registry rule), roadmap.md, sitemap.
