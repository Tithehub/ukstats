# Calmer PDF cover with UK map / globe artwork

## What changes
- Tone down the cover title: "UK DAILY REPORT" drops from 52pt heavy black to about 34pt in a lighter bold, all white (no bright blue "REPORT"). The headline debt figure shrinks from 38pt to about 28pt, and the four tiles' figures from 18pt to about 14pt. Spacing stays generous, so it reads as a calm, premium briefing.
- Remove the big background rings.
- Add artwork to the top right of the cover, beside the title, in soft navy and blue line-art that matches the brand:
  - UK report: an outline map of the United Kingdom.
  - Global report: a wireframe globe (latitude and longitude lines with continents).
- The artwork is decorative only. It carries no figures or labels.

## Checks
- Render both covers from today's saved data, then check that the artwork sits clear of the text and nothing overlaps or gets cut off.
- Report tests still pass.

## Technical details
- Generate two transparent PNGs, `src/assets/report/uk-map.png` and `globe.png`, sized about 600px. Embed them in `report-pdf.ts` through `doc.embedPng`, loaded inline the same way the fonts are loaded in `reports.server.ts`, and passed in through `ReportInput`.
- Adjust the type sizes and fonts in `drawCover()`.
