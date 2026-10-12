# Make the countries easy to find again

## What happened

Nothing was removed — all 33 country pages are still live (e.g. ukstats.co.uk/fr, ukstats.co.uk/us) and the "Countries" link still exists. The problem is visibility:

- The "Countries" link only appears in the top bar on wide screens (1024px and up). On a laptop window, tablet or phone it is hidden.
- The slide-out menu (the ☰ button) has no "Countries" entry at all.
- The home page itself never mentions the countries.

## The fix

1. **Menu:** add "Countries" to the Data group in the slide-out menu, so it appears on every screen size.
2. **Home page:** add a short "Around the world" section below the hero — a sentence plus links to the Countries page, the country comparison tool, and a few example countries (France, Germany, US) — so visitors landing on the home page see that 33 countries are covered.
3. Check the result in the preview on a narrow and a wide screen.

## Technical details

- Edit `src/components/layout/SiteHeader.tsx`: add `{ to: "/countries", label: "Countries", icon: MapIcon }` to the "Data" group in `NAV_GROUPS`.
- Edit `src/routes/index.tsx`: insert a small section with `Link`s to `/countries`, `/compare-countries` (search `metric: "hicp"`) and `/fr`, `/de`, `/us`, using existing night/electric tokens.
- No data, backend or publishing changes. Verify with Playwright at 895px and 1280px widths.
