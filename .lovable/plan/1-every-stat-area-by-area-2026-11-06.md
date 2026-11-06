Let the presenter read every published stat, grouped by area, plus the latest headlines for each country.

## 1. Every stat, area by area
- Today she reads up to 6 stats per area, and some areas are skipped: population, housing, weather and politics/polling.
- Each area gets its own segment, so weather never mixes with crime, money and so on: Small boats, Legal migration, Population, Economy, Cost of living, Crime, Health, Housing, Defence and alerts, Politics and polls, then Weather on its own.
- No cap: every published figure in an area is shown and read. Areas with no published figure are still left out, and "Not published" stays as it is.
- Other countries get the same treatment: all their published figures, not just the first 8.
- Each segment runs long enough for her to finish reading every card before it moves on.

## 2. Headlines for each country
- After the figures, she reads the latest headlines for that country (up to 5), word for word, naming the publisher and labelled as news, not official.
- Headlines come only from the news and police feeds the site already collects. If a country has none, she says "No recent headlines collected."

## Checks
- Tests: no area is capped at 6, weather has its own segment, a country without headlines gets the "no headlines" line, and nothing outside the published values is read out.
- Check the stream at 1920×1080 and in portrait so nothing is cut off. Then wait for your "publish".

## Technical details
- `stream-rundown.ts`: remove the `max = 6` cap in `publishedIn`; add segments for Population & migration, Housing, Politics & polling and Weather; remove `.slice(0, 8)` in `countrySegment`; give each segment duration `cards.length × CARD_MS` in `stream-schedule.ts`.
- Match country headlines by name/demonym from `news-reports` items; add `scriptForHeadline(h)` in `stream-script.ts` (verbatim text and publisher only), queued in `Presenter.tsx` after the cards.
