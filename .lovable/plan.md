# Small boats page: live comparison with Small Boat Watch, and closing the gaps

## Live comparison (checked 22 Oct 2026)

Note: smallboatwatch.com is a parked domain. The real Small Boat Watch is Reform UK's iPhone app (reformparty.uk/app/boatwatch).

| | UKStats /small-boats | Small Boat Watch (Reform app) |
|---|---|---|
| Platform | Web, any device, free, no account | iPhone only, account needed for game |
| Data source | Home Office time series, linked | Same Home Office publications |
| Latest day shown | 15 Oct 2026 (weekly series) | Daily (last-7-days page, now to 20 Oct) |
| Running total since 2018 | Yes (213,545) | Yes |
| Per Prime Minister totals | Yes, with days, boats, per-day | Yes, plus cost |
| Cost figures | None (no official figure exists) | Reform's own estimates, not official |
| Monthly chart, CSV download | Yes | No CSV |
| Day-by-day list | No | Yes |
| Latest day vs previous days/weeks | No | Yes |
| Daily alert | Built, waiting on a sender address | Push notification |
| News, game | No | Yes |
| Share buttons, embed | Yes | No |

Where we win: open web, official-only figures, CSV, provenance, sharing. Where they win: freshness (5 extra days), day-by-day view, "how today compares".

## What to build

1. Fresher figures: add the GOV.UK "last 7 days" daily figures onto the page so the latest day matches the Home Office (20 Oct today), clearly labelled provisional, without double-counting days already in the time series.
2. Day-by-day list: the last 30 days in a table (date, people, boats), with "Show more" back to 2018.
3. Latest day compared: the latest day against the 7-day and 30-day averages and the same week last year — all plain arithmetic on published figures, no estimates.
4. Keep "no cost figures" with a short line explaining why (no official cost per crossing).
5. Daily alert stays pending until you give a sender email address.

Not building: cost estimates, news feed, game.

## Technical details

- Reuse the existing last-7-days parser used by the main register; merge by date with the time series taking priority for overlapping dates, and record source and date per row.
- Pure helpers for merge and comparisons with tests (overlap handling, averages, same-week-last-year).
- Run tests, security scan, then publish to ukstats.co.uk.
