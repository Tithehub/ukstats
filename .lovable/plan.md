# Use the new covers on the Reports page

The real daily reports already use the new covers. This change swaps the old sample pictures on the Reports page for the new ones.

## Changes
- Replace the old "Cover" sample with the new UK cover (UK map, white logo).
- Add the new Global cover (globe) next to it, so buyers can see both editions.
- Replace the "Headline figures" sample with the new inside page that has the white logo header.
- Keep the "Every figure, sourced and dated" and "World rankings" samples, so there are still four pictures in the row. They show the inside pages, which haven't changed.

## Technical details
- Convert the approved PNGs (uk-cover_v1, global-cover_v1, inside-page_v1) to compressed JPGs in src/assets/reports/.
- Update the imports and the sample array in src/routes/reports.tsx to show: UK cover, Global cover, Headline figures, World rankings. The figure-table sample is dropped to keep four.
- Check the page in the browser.
