# Show the new report covers

Make sample covers for both reports with the new white website logo, so you can see them in chat before publishing.

## What you'll get
- UK Daily Report cover (UK map artwork, debt headline, "Inside" line, QR)
- Global Daily Report cover (globe artwork)
- One inside page with the logo in the header, for comparison

Each one is saved to Files as an image and shown in chat. A sample PDF of each report is included too.

## Notes
- The samples use the latest saved official figures. Nothing is made up; anything missing shows "Not published".
- The website and the real daily reports stay as they are. These are previews only.

## Technical details
- Run buildReportPdf with the cached uk-stats / world-bank-v2 / unrest-v1 / news-reports-v1 payloads and the project fonts in /tmp.
- Rasterise page 1 (and page 2) with pdftoppm at 150 dpi and check each image.
- Save to /mnt/documents/report-covers/ as uk-cover_v1.png, global-cover_v1.png, inside-page_v1.png, and the two PDFs.
