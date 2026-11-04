# Fixed "Top 6" stats panel on the live stream

## What viewers will see
A permanent strip of 6 small stat boxes on the stream, always visible beside the big rotating figure, for whichever country is on air:

1. **Irregular migration & small boats** (red, always first) — UK: latest Home Office day (people, boats, date). Other countries: "Not published for this country".
2. GDP per person
3. Inflation
4. Unemployment
5. Government debt (% of GDP)
6. Population

Each box shows the value, the year/date and a short source line (World Bank / Home Office). Missing figures say "Not published" — nothing is estimated.

- **UK hour:** strip shows the UK's 6 all hour.
- **World hours:** strip switches with each country every 5 minutes.
- **Landscape:** a 6-box row across the top of the right-hand panel (3×2 grid), the big figure card shrinks slightly to fit.
- **Portrait:** a 3×2 grid above the figure card.
- Text no smaller than about 20px, nothing cut off (checked with the studio's cut-off warning).

## Technical details
- New pure helper `topSix(worldPayload, iso3, boatsPayload, isUk)` in `src/lib/stream-extras.ts`, sharing the `TOP_FIVE` indicator list (moved from GlobeExplorer to `src/lib/world.ts` so globe and stream use one list).
- Broadcast page loads `worldQuery` and `smallBoatsQuery` (shared Query options, no extra network work on reload).
- New `TopSixStrip` component inside `globe_.broadcast.tsx`, with `data-fit` for overflow reporting; layout rows adjusted at 1920×1080 and 1080×1920.
- Tests in `stream-extras.test.ts`: migration box comes first; UK uses the latest Home Office day; non-UK shows "Not published"; missing World Bank values show "Not published".
- Browser check at 1920×1080 and 1080×1920 in a UK hour and a world hour.
