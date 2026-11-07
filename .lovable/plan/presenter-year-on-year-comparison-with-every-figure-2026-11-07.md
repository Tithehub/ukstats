# Presenter: year-on-year comparison with every figure

## What viewers will hear
After each figure, the presenter adds a one-line comparison with the same period a year earlier, for example:

> "National debt. £2.9 trillion. That's up £140 billion on a year earlier, from £2.76 trillion in October 2025. Source: Office for National Statistics."

- Says "up", "down" or "unchanged", the difference, and last year's figure with its date.
- For rates (inflation, unemployment) the difference is said in percentage points.
- Where the figure itself is already a 12-month change (e.g. CPI inflation), she says so instead of comparing twice: "That's the change over the past twelve months."
- If the publisher hasn't released a figure for the same period last year, she says "No year-earlier figure is published" — nothing is guessed or estimated.
- The same comparison shows as a small line under the figure on the stream card, so what she says matches what's on screen.

## Rules kept
- Last year's figure must come from the same official publisher's own series and the same measure — never another source, never interpolated.
- Monthly figures compare with the same month a year earlier; quarterly with the same quarter; annual with the previous year. If that exact period is missing, no comparison.
- The difference is simple arithmetic between two published figures, labelled "change on a year earlier".
- Weather, warnings, headlines and live readings (flights, unrest) get no comparison.

## Technical details
- Add an optional `yearAgo: { value, period }` to the figure data, filled in the existing collectors (ONS, Home Office small boats, Eurostat, World Bank, national sources) from the series they already download — no new feeds.
- Pure helper `yoyLine(card)` in `src/lib/stream-script.ts`, used by `scriptForCard` and the stream card sub-line; respects the 400-character cap.
- Tests: up/down/unchanged wording, percentage-point wording, period-mismatch gives "No year-earlier figure is published", already-annual-change measures skip comparison.
- Stored snapshots refresh on next collection; until then cards without `yearAgo` say no comparison is published.
