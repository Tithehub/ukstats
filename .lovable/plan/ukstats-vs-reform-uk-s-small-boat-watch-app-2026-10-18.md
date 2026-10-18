# UKStats vs Reform UK's "Small Boat Watch" app

## The comparison

| | Small Boat Watch (Reform UK) | UKStats |
|---|---|---|
| What it covers | Small boats only | Small boats plus crime, finance, cost of living, debt and more, across 33 countries |
| Where the figures come from | Home Office crossing figures. Its cost figures are Reform's own estimates, not official statistics. | Official figures only. Every number shows its source, period, age and next release. |
| Day-by-day history since 2018 | Yes | No. Only the last 7 days and weekly totals. |
| Crossings under each Prime Minister | Yes, with estimated costs | No |
| Daily phone alert | Yes, opt-in | No |
| Phone app | iPhone and Android. 4.0 stars from 134 iPhone ratings; 3.2 stars from 215 Android reviews. | A website that can be added to the home screen |
| Extras | News from Reform and an arcade game that needs an account | Free API, embeddable widgets, sharing tools |
| Political | Published by a political party | Independent; no party branding next to the figures |

**Where we're stronger:** trust, breadth and openness. We show nothing we can't source.
**Where they're stronger:** small boats depth, daily alerts and the feel of a phone app.

## Proposed improvements (closing the gap honestly)
1. **Full small boats history:** every day since 2018 from the Home Office data set, with a chart, a table and a CSV download.
2. **Crossings by Prime Minister:** official crossing totals and daily averages for each Prime Minister's time in office. Office dates come from GOV.UK. No cost estimates, because no official per-crossing cost is published.
3. **Daily small boats alert:** an opt-in email sent when new Home Office figures appear.
4. **Better "add to home screen":** a clearer install prompt on phones so UKStats feels like an app.

## What we won't copy
- Unofficial cost estimates, the game and party news. They would break the "real official facts only" promise.

## Technical details
- Parse the Home Office time-series workbook (daily crossings since 2018) into a stored series, served through a new history entry for `uk-small-boats-daily`.
- Store Prime Minister terms as a small, sourced table with GOV.UK links. Totals are computed from the official daily series only.
- Alerts reuse the daily sweep, with an opt-in email list stored in the database.
- Add tests for the per-Prime-Minister totals and for the rule that a missing day blocks the total.
