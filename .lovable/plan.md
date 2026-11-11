# UK Debt on every daily PDF, with the new logo

## What you'll get
Every day's "UK & Global Stats" PDF carries a clear **UK Debt** panel:
- **Cover:** the latest official UK public sector net debt figure, large, with "as at [month]" and "ONS, published [date]".
- **New "UK Debt today" box near the front of page 2**, showing:
  - Net debt (£bn) and the change from the previous month
  - Debt as a share of GDP
  - Which month it covers, when ONS published it, and when the next figure is due
  - How many days old the figure is
  - Link and QR to the ONS source

## Your new logo
The uploaded white-on-navy UKStats logo (bars + "UKStats") replaces the current cover logo, kept in proportion, never stretched.

## Important honesty point
ONS publishes UK debt **once a month** (around the 21st), not daily. Each day's PDF shows the newest official figure with its date; it changes on the day ONS releases a new one. No ticking "debt clock" or daily estimate — that would be a made-up number.

If the official figure can't be fetched, the PDF shows the last saved official figure with its original dates, never a blank or a guess.

## Technical details
- `src/lib/report-pdf.ts`: keep cover headline (uk-national-debt) and add period + release-date label; add a "UK Debt today" panel at the top of the first content page using `uk-national-debt` and `uk-debt-gdp` (value, change, period, release date, next release, age).
- Logo: trim the navy margin from the uploaded PNG, save as a report asset, embed it in place of the drawn `logo()` on the cover masthead.
- `src/lib/reports.server.ts`: fall back to the uk-stats lastGood copy so debt is present whenever any snapshot exists.
- Test in `reports.test.ts`: debt panel fields present; no value rendered when the metric is missing.
- Render a sample PDF and check cover and panel visually. Nothing published.
