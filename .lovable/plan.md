# Combine the original UKStats welcome with the new home preview

Only the `/new-home` preview changes. The live homepage stays exactly as it is.

## What you'll see at the top of /new-home
1. The live red ticker and the site menu stay where they are.
2. A new top section, worded and styled exactly like the current homepage (same font, sizes and layout, left-aligned, with the network picture behind it):
   - "Official statistics · UK & worldwide" (small label)
   - **UKStats** (big heading)
   - "Built by the people, for the people — real official facts only"
   - "Debt, prices, crime, migration and more — from official publishers. Every figure dated. Nothing guessed."
   - The "Find a UK statistic" search box with the "Find figures" button, plus the "All UK statistics", "Explore countries" and "Safest places" buttons.
3. Straight after that, the main figures in bold: the big national debt figure with its source, period and next release, then the "Free forever" badge. The second search box in that section is removed, so there's only one search.
4. Everything below stays the same: the smaller red/yellow warning tiles, the small-boats lead story, topics, live stream and the paid-services link.

## Technical details
- In `src/routes/new-home.tsx`, add a hero section copied from `src/routes/index.tsx` (lines 186–220): same classes, `heroNetwork` image, `SLOGAN` from brand.ts, and a GET form to `/register`.
- Change the debt section heading from `h1` to a styled `p`/`h2` so the page keeps a single `h1` ("UKStats"). Remove its duplicate search form and the `q` state it uses.
- No data, colour-rule or homepage changes. Check with screenshots at phone and desktop sizes.
