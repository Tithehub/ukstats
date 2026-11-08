# Real UKStats logo on the PDF cover

## What changes
- Replace the simple three-bar mark at the top left of the cover with the real UKStats logo, the three rising bars with slanted tops from your uploaded logo.
- Make all three bars white (no blue bar), next to the white "UKSTATS" wordmark.
- Use the same real logo shape in the small header on the inside pages, kept white there too, so the whole report matches.

## Checks
- Render the UK and Global covers and one inside page, compare the shape with the uploaded logo, and save previews as v4 files.
- Report tests still pass.

## Technical details
- In `src/lib/report-pdf.ts`, redraw `logo()` as vector shapes traced from `uks3.png`. The bar corners are measured from the 1024px image, so the logo stays sharp at any size.
- Add an all-white option to `logo()` and use it on the cover and the page headers.
