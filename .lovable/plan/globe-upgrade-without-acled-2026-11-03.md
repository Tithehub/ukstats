# Globe upgrade without ACLED

Build the globe out using only sources we already trust: UK Foreign Office (FCDO) and US State Department advice, plus the World Bank rankings. The ACLED research layer stays off and labelled "no data access yet".

## What visitors get
1. **Colour key and rank on hover.** When the globe is coloured by a statistic, a legend shows the colour scale and its year. Hovering a country (or tapping it on a phone) shows the country name, its figure, its rank and the year of that figure.
2. **Warning level layer.** A new "Travel advice level" colouring:
   - US countries are coloured by the State Department's own Level 1–4.
   - UK countries are coloured only by the FCDO's own "advise against all travel" and "advise against all but essential travel" statements.
   - Each country shows which government said it, and when. Nothing is merged or guessed.
3. **Warning list beside the globe.** A filterable list of every current official warning, filtered by government (UK or US), type (riot or protest) and how recent it is (24h, 7 days, 30 days). Clicking a warning flies the globe to it. The list also gives visitors a non-3D way to reach the same information.
4. **Compare from the globe.** Choose "Compare" on two countries to open the existing world comparison page with both already chosen.
5. **Tour and controls.** Buttons for "Next warning" and "Next country", auto-rotate on/off, and a reset view. Animation stops when a visitor's device asks for reduced motion.
6. **Shareable views.** The layer, filters and selected country stay in the web address, so a link reopens exactly that view.
7. **Phone layout.** On phones the country panel becomes a pull-up sheet at the bottom of the screen. I'll check this in a phone-sized browser.

## Not included
- No ACLED data, no news-derived markers, no inferred riot locations.
- Nothing is published until you say "publish".

## Technical details
- `src/lib/unrest.ts`: pure parsers for the State Dept level and FCDO travel-against statements, plus `travelAdviceLevel()`, with tests using real sample text.
- `src/lib/globe-legend.ts`: colour-scale and rank helpers, with tests.
- `EarthGlobe.tsx`: hover labels, the legend, tour/rotate controls and reduced motion. `GlobeExplorer.tsx`: warning list, compare action and a bottom sheet on small screens.
- `globe.tsx` and home `validateSearch`: new search parameters (`layer`, `gov`, `age`, `cmp`).
- Update the globe rule in AGENTS.md, run the tests and check the globe in the browser on computer and phone sizes.
