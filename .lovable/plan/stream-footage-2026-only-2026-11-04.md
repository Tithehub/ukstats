# Stream footage: 2026 only

## What changes
- The stream only plays clips filmed in 2026 or later. Nothing older ever plays — no "archive" fallback.
- Topics with no 2026 clip show the existing "No licensed clip for this topic" card instead of old footage.
- The "Archive footage" label goes; every clip shown is labelled "2026 footage" with its filming date, credit and licence.
- Search Wikimedia Commons (and other free-to-reuse official sources: OGL, Open Parliament Licence, US government) for 2026 clips for each topic — boats, economy, cost of living, crime, NHS, legal migration, defence, flights, warnings/news — and add every one that passes the licence check. Still no BBC/Sky/news-outlet footage.

## Honest expectation
Today only 2 of the 22+ clips are from 2026. Free 2026 footage is scarce, so several topics will show the no-clip card until more is published.

## Technical details
- `src/lib/stream-clips.ts`: replace `RECENT_MONTHS` with `MIN_FILMED_YEAR = 2026`; `clipsFor` returns only clips with `published >= "2026"`, newest first; drop the archive branch; `clipTier` removed or always "newest".
- Remove pre-2026 entries and their asset files from `stream-clips.data.ts` / `src/assets/stream-clips/`.
- Update `stream-clips.test.ts`: a 2025 clip is never returned; empty result when no 2026 clip matches.
- Update the ClipBox label in `globe_.broadcast.tsx`.
