# World-class front page for the daily PDF reports

Redesign page 1 of the UK and Global daily reports so it looks like a premium newspaper / financial briefing cover. Nothing inside the report changes, and no figures are invented.

## New cover layout (A4, navy)

```text
+--------------------------------------------------+
| red bar / white hairline                          |
| [logo] UKSTATS  ukstats.co.uk     EDITION No. 312 |
|                                   SUN 8 NOV 2026  |
|--------------------------------------------------|
| OFFICIAL FIGURES ONLY  (yellow tag)               |
| UK DAILY                                          |
| REPORT              (huge type, two weights)      |
| Sunday 8 November 2026 ____                       |
|                                                    |
| +-- HEADLINE FIGURE (large panel) --------------+ |
| | National debt  £2.8tn   source · period · date| |
| +-----------------------------------------------+ |
| [fig] [fig] [fig] [fig]  4 key-figure tiles with  |
|  source + period under each, "Not published" if   |
|  missing                                          |
|                                                    |
| INSIDE THIS EDITION        TODAY'S WARNINGS       |
| 01 Key figures   p2        Terror: SUBSTANTIAL    |
| 02 Warnings      p4        Weather: 2 yellow      |
| 03 Supply kits   p5        Floods: none           |
| 04 Headlines     p6        (from saved data only) |
|                                                    |
| Built by the people, for the people.     [QR]     |
| Compiled ... · Free stats stay free forever       |
| blue footer bar                                   |
+--------------------------------------------------+
```

- Global edition: same design, headline panel shows world/UK highlights already in the report, warnings box shows count of countries at the highest UK/US advice levels.
- Subtle navy-on-navy grid/globe line pattern in the background for depth (drawn shapes, no photos, so file stays small).
- Real page numbers in the contents, worked out after the inner pages are laid out.
- Edition number derived from the report's date (days since launch), not invented.

## Checks
- Render sample UK and Global PDFs from saved data, screenshot page 1, confirm nothing overlaps or is cut off, long values shrink to fit, and missing figures show "Not published".
- Existing report tests still pass.

## Technical details
- `src/lib/report-pdf.ts`: replace the cover block (lines ~108-148) with a `drawCover()` function; draw contents after inner pages so page numbers are real.
- Use only values already passed to the PDF (metrics, warnings from `report-extras.ts`).
- Applies from the next generated edition; already-made reports unchanged.
