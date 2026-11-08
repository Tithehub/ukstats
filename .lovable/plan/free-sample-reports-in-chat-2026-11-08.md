# Free sample reports in chat

Make fresh, complete sample copies of both daily reports and put them in your Files, so you can open and download them here without paying. The website and its checkout stay as they are.

## What you'll get
- UK Daily Report sample (PDF): new cover, white logo, warnings, supply kits, headlines and the new "Thank you to our sponsors" back page.
- Global Daily Report sample (PDF): the same, plus every country's travel warnings and world headlines.
- A preview picture of each cover in chat.

## Notes
- Built from the latest saved official figures. Nothing is invented; anything missing shows "Not published".
- The sponsor page lists your five live sponsors.
- Each page is checked visually before it is shared.

## Technical details
- Run buildReportPdf in /tmp with cached payloads (uk-stats, world-bank-v2, unrest-v1, news-reports-v1), live sponsors via directoryEntries, and the project fonts/artwork.
- Rasterise every page with pdftoppm and inspect for clipping or overlap.
- Save to /mnt/documents/report-covers/ as uk-daily-sample_v2.pdf and global-daily-sample_v2.pdf (the v1 files are kept).
