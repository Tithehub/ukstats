# FT story: show the FT chart screenshot

## What gets built
- Your screenshot of the FT chart ("Rupert Lowe has greater visibility on X than most world leaders — Views of posts on X, Jan–Oct 2026") is shown inside the main story card on the home page, under the headline.
- Caption under it: "Chart: Financial Times, 8 Nov 2026" with a link to the article. Clicking the chart opens the FT story.
- Fits the card width on all screens and loads lazily so the home page stays fast.
- The image has a proper description so screen readers can read it.
- The card stays labelled "press coverage, not an official statistic". The chart's numbers are the FT's and are never added to the site's figures.

## Note
The chart is FT copyright. Showing it with a clear credit and link is common practice, but the FT could ask for it to be removed. If that happens, we can take it down in one change.

## Technical
- Upload `image-6.png` with lovable-assets to `src/assets/ft-x-views-chart.png.asset.json`; add `chart` (asset, alt, credit) to `featured-story.data.ts`; render in `FeaturedStory.tsx`.
- Nothing published until you say so.
