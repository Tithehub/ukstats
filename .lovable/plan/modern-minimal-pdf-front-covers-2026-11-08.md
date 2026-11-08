# Modern, minimal PDF front covers

Strip the cover back to a few elements with lots of breathing room, like a premium annual report. Nothing inside the report changes, and the four key figures and the warnings stay on page 2 onwards.

## New cover (UK and Global, same design)

```text
+--------------------------------------------+
| thin red line                              |
| [logo] UKSTATS              No. 312 · 2026 |
|                                            |
|                                            |
|            (large UK map / globe,          |
|             soft blue, centred)            |
|                                            |
|                                            |
| UK Daily Report       (light, 30pt)        |
| Sunday 8 November 2026                     |
| ___                                        |
|                                            |
| UK public sector net debt                  |
| £3,005bn   ONS · Sep 2026                  |
|                                            |
| Inside: At a glance · Warnings ·           |
|         Headlines · Register · Sources     |
|                                            |
| ukstats.co.uk · Official figures only [QR] |
+--------------------------------------------+
```

- Remove the yellow tag, the four figure boxes, the warnings list, the numbered contents and the long footer text.
- One headline figure only, set in light type, with its source and period kept on the cover.
- The contents become a single quiet line of section names.
- The artwork becomes the centrepiece: larger and centred.
- A smaller QR code with a single caption.
- Colours limited to navy, white, soft blue, and one thin red accent.

## Checks
- Render both covers from today's saved data, confirm the spacing is clean and nothing overlaps, and save the previews as v3 files.
- Report tests still pass.

## Technical details
- Rewrite `drawCover()` in `src/lib/report-pdf.ts`. Reuse the existing artwork PNGs. Remove the unused tile and warnings code from the cover.
