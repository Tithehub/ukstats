# Globe as the main control for UKStats

Make the 3D globe the first thing visitors use to move around the site, while every existing page, button, search and link keeps working exactly as today.

## What visitors will see

1. **Home page leads with the globe**
   - A large interactive globe sits at the top of the home page, beside the search box ("Find debt, inflation, crime…").
   - The UK is highlighted and pre-selected on ukstats.co.uk; on stats.solutions the globe starts zoomed out.
   - Everything currently on the home page (sponsor banner, Restore Britain panel, preparedness banner, topic buttons, headline figures, category panels) stays, just below the globe.
   - On phones the globe is shorter and a "Skip the globe" link jumps straight to the figures.

2. **Click a country → a control panel**
   - Clicking any country opens a side panel (bottom sheet on phones) with its key figures and dated sources, plus buttons to every page we already have for it:
     - UK: All UK statistics, small boats, crime and safest places, cost of living, debt & economy, NHS, parties, polling, preparedness.
     - Other countries: country statistics page, world-ranking profile, compare with another country, safest places (only where we have comparable data), official preparedness advice (only where verified), official travel warnings.
   - Buttons only appear where the page genuinely exists for that country — nothing is shown as available when we don't have it.

3. **Globe controls**
   - "Colour by" picker: any of the 20 world ranking figures (grey where no recent figure, as now).
   - Layer toggles: official unrest warnings, and the ACLED research dots (still labelled "Not connected" until the login is supplied).
   - Country search box that flies the globe to the country.
   - The globe's settings stay in the web address, so links are shareable and Back works.

4. **Globe reachable everywhere**
   - "Globe" becomes the first item in the top menu.
   - Country pages, world rankings and compare pages get a small "View on globe" button that opens the globe on that country.
   - The full /globe page stays as the full-screen version.

5. **Fallbacks so nothing breaks**
   - If a device can't show 3D (old phone, graphics off), a flat clickable country list appears instead, with the same buttons.
   - The globe loads after the page's figures, so the home page doesn't get slower; a still image shows while it loads.

## Not changing
- No new figures or sources; unrest rules unchanged (only publishers' own words within 30 days).
- Payments/donations stay paused; no sponsor content on the globe.
- Existing pages and links keep their current addresses.

## Technical details
- Extract the globe + control panel from `src/routes/globe.tsx` into a shared `GlobeExplorer` component (lazy-loaded, client-only) used by both `/globe` and the home page.
- New pure helper `countryDestinations(code)` in `src/lib/globe-destinations.ts` mapping a country to existing routes, gated on the country registry, city-crime coverage and preparedness data; unit tests confirm UK gets small boats, an unsupported country gets no safest-places link.
- WebGL detection → flat list fallback; `requestIdleCallback`-deferred import so home-page data still renders first.
- Home search params (`c`, `ind`) added to the index route without affecting existing ones.
- SiteHeader: Globe first; "View on globe" links on country/world/compare routes.
- Browser-check desktop and phone; run tests; speed check on home stays within current timings.
