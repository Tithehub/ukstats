# Add official statistics office links to every country page

## Goal
Each country's Sources page already lists the source behind every figure. This adds a clear "National statistics office" block at the top so visitors can reach the country's own official statistics agency directly.

## What changes

1. **Country Sources page** (`src/routes/$country.sources.tsx`)
   - New section above the per-figure list: "National statistics office" — the office name and website already stored in the country registry (`src/lib/countries.ts`), e.g. INSEE for France, Destatis for Germany, Statistics Canada, ABS for Australia.
   - For the 30 European countries, also link Eurostat as the cross-country source.
   - For the US, replace the single generic usa.gov link with the agencies we actually use: BLS, BEA, US Treasury, Federal Reserve, FBI Crime Data Explorer.

2. **Cross-country links** — a small "Compare across countries" line linking Eurostat, OECD Data and the ECB where relevant.

3. **No new figures** — links only; the no-invented-figures rule is untouched.

## Technical notes
- All data needed is already in `COUNTRIES` (office, officeUrl); the US entry gets a small list of agencies instead of one URL.
- Links open in a new tab with `rel="noreferrer"`, matching existing source links.
- Preview only; publish when you ask.
