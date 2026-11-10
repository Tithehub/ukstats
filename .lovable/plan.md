# Presenter says dates in spoken English

## What changes
Every date the presenter reads aloud is said the way a person would say it:
- 10/11/2026 or 2026-11-10 → "the tenth of November, twenty twenty-six"
- 1 November 2026 → "the first of November, twenty twenty-six"
- Month and year only (e.g. "November 2026") → "November twenty twenty-six"

This covers every slot (cards, second UK hour publish/next-update dates, headlines, sponsor and explainer lines). UK day-first order is used for slash dates (10/11 = 10 November). The screen keeps showing dates as it does now — only the voice changes.

## Checks
New automatic checks for the examples above, plus the existing stream checks.

## Technical details
- `src/lib/stream-script.ts`: add `sayDate(day, month, year)` (ordinal words 1–31, year words e.g. 2026 → "twenty twenty-six", 2000–2009 → "two thousand and N"); `spokenDate` returns it; `speakable` also converts `dd/mm/yyyy`, "D Month YYYY" and "Month YYYY" text into the spoken form. Server-side guard already calls `speakable`, so it applies there too.
- Tests in the existing stream-script test file.
