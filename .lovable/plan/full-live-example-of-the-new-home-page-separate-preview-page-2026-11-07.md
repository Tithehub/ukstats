# Full live example of the new home page (separate preview page)

The current home page stays exactly as it is. I'll build a working example on its own hidden page, **ukstats.co.uk/new-home**, using live figures, so you can click around it on phone and desktop before deciding anything.

## What the page shows (top to bottom)
1. **Red LIVE bar** with a ticker of the latest official headlines (from E).
2. **National debt figure** written out in full, glowing, with % of GDP, the monthly change and the next release date (from D). Below it, "Free forever · official sources only" and the search box.
3. **Block colour status tiles**, using colour to show status:
   - **Red:** terror threat level (Severe or Critical), or red weather warnings.
   - **Amber:** amber weather warnings, or figures that are getting old.
   - **Yellow:** yellow weather warnings.
   - **Green:** no warnings in force, or a fresh figure.
   - Tiles: terror threat, Met Office warnings, flood warnings, small boats (latest day), inflation, crime. The colour comes from the publisher's own level, never guessed.
4. **Lead story with a photo:** small-boat arrivals over the Dover cliffs picture, with the last 7 days and year figures.
5. **Photo tiles:** debt (Westminster) and weather (London fog), plus council spending.
6. **Icon topic grid:** cost of living, immigration, crime, finances, spending, housing, weather, grooming inquiry, preparedness, world and globe, live stream.
7. **Further down, everything we have now:** the live stream player, the globe, countries and world rankings.
8. **Paid services band:** "Stats are free. Your brand on them is what keeps them free", with links to Rent UKStats and sponsorship.

It works in both light and dark, and follows the existing light/dark button.

## Rules kept
- Every figure comes from the same official feeds as today, with its source, date and age.
- Anything missing shows "Not published".
- The photos are decoration only and never carry figures.
- The page isn't linked from the menu and is hidden from search engines while it's a preview. Once you approve it, it replaces the home page and keeps every link.

## Technical details
- New route src/routes/new-home.tsx with its own head() (noindex). It reuses the existing UK stats query options and loader, plus LiveStreamPanel and GlobeExplorer, so there's no new data source.
- The three photos (Dover cliffs, London fog, Westminster) are saved as project assets in src/assets.
- New semantic tokens in src/styles.css for the block colours (status-red, status-amber, status-yellow, status-green) in light and dark. No hardcoded colours.
- Tile colour comes from a small pure helper (statusTone) with a unit test: Severe/Critical → red, red/amber/yellow Met Office warnings → matching colour, no warnings → green.
- Check at 375, 768 and 1440 widths in both modes, and send the screenshots.
