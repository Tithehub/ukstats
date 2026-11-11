# Home page: show the 7-day small-boat total by default

## What you'll see
- The "Small-boat arrivals" tile in the "UK right now" grid shows the **last 7 days** total (Home Office), labelled "Small-boat arrivals, last 7 days".
- The big Small-boat arrivals feature further down shows the 7-day total as the main number, with the latest single day underneath as a smaller line (e.g. "0 on 10 November").
- The scrolling ticker line uses the 7-day total too.
- Source, period, age and next release stay on every figure. If the 7-day total isn't published, it says "Not published" — we never fall back to a guessed number.

So the headline only reads zero if nobody crossed for a full 7 days.

## Technical details
- `src/components/home/UkLanding.tsx`: swap `boats` (uk-small-boats-daily) for `week` (uk-small-boats-week) in the Tile, lead-story headline, Meta line and ticker; daily figure becomes the secondary line.
- No data/source changes; the 7-day metric already exists. Check desktop and phone preview. Nothing published.
