# Global Stats after the UK Stats, in the same daily PDF

## What you'll get
Each day's "UK & Global Stats" PDF reads in two clear halves:

```text
Cover
PART 1 - UK STATS
  UK Debt today
  At a glance (headline figures)
  UK Government warnings + supply kits
  Main UK headlines
  Official UK register (every category)
PART 2 - GLOBAL STATS   <- new divider page with globe image
  World rankings (top ten per measure)
  Five main figures, every country
  Government travel warnings, every country (UK FCDO + US State Dept)
  Main headlines by country
Sources and method
Thank you to our sponsors
```

- A new navy **"Global Stats"** divider page (globe image, your logo, date) marks where the UK half ends.
- The cover's "Inside" line lists the sections in this new order.
- Same rules as now: every world figure keeps its source and year; if world figures are unavailable that day, the Global section says "Not published" rather than being dropped silently.

## Why this is needed
The global sections already exist, but travel warnings and world headlines currently appear in the middle of the UK half, before the UK register. This reorders them so the UK is complete first.

## Technical details
- `src/lib/report-pdf.ts`: move the travel-warnings and per-country headlines blocks out of the UK warnings area to after the World rankings / Country-by-country blocks; add a "Global Stats" divider page (navy, combined/globe art, `brand()` logo) before the world block; add "UK Stats" part label on the UK Debt page.
- Rebuild a sample using the real saved UK and World Bank snapshots and check every page visually (UK half, divider, global half, sources). Delete nothing; nothing published.
