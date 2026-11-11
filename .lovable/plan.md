# UK Debt on every daily PDF

## What you'll get
Every day's "UK & Global Stats" PDF carries a clear **UK Debt** panel:
- **Cover:** the latest official UK public sector net debt figure, large, with "as at [month]" and "ONS, published [date]".
- **New "UK Debt today" box near the front of page 2**, showing:
  - Net debt (£bn) and the change from the previous month
  - Debt as a share of GDP
  - Which month it covers, when ONS published it, and when the next figure is due
  - How many days old the figure is
  - Link and QR to the ONS source

## Important honesty point
ONS publishes UK debt **once a month** (around the 21st), not daily. So each day's PDF will show the newest official figure with its date, and the figure will change on the day ONS releases a new one. We will not show a ticking "debt clock" or any daily estimate, because that would be a made-up number under the site's rules.

If the official figure ever can't be fetched, the PDF shows the last saved official figure with its original dates, never a blank or a guess.

## Technical details
- `src/lib/report-pdf.ts`: keep the cover headline (uk-national-debt) but add period + release date label; add a "UK Debt today" panel at the top of the first content page using `uk-national-debt` and `uk-debt-gdp` metrics from the saved uk-stats snapshot (value, previous/change, period, release date, next release, age).
- `src/lib/reports.server.ts`: the build already reads the uk-stats snapshot; fall back to its lastGood copy so debt is always present when any snapshot exists.
- Add a test in `reports.test.ts` that a built report's input includes the debt panel fields and never renders a value when the metric is missing.
- Render a sample PDF and check the cover and panel visually. Nothing published.
