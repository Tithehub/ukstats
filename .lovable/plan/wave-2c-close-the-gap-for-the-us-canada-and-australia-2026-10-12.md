# Wave 2c: close the gap for the US, Canada and Australia

Every new figure below was tested against the real publisher a few minutes ago and returned live data. Nothing here is a guess: if a feed stops answering, the card shows no figure rather than a number.

## What gets added

**Australia** — inflation and earnings become live
- Inflation (CPI, 12-month change): the ABS feed returns **3.6% for 2026-Q2**, with history back through 2023. This replaces the card that currently says "No live feed".
- Average weekly earnings: the ABS feed returns **$1,875.90 for 2026-S1**, semi-annual history back to 2022.
- The card titles will use the labels the ABS uses for those two series, read from the feed itself before the cards go out — not invented by me.

**United States** — four new figures
- Average interest rate on the federal debt: **3.531% at 30 September 2026** (US Treasury, "Total Interest-bearing Debt"). This sits beside the debt total and answers "what does the debt cost".
- Core inflation (all items except food and energy) and housing/shelter costs — both from the Bureau of Labor Statistics, both shown as 12-month changes.
- Official weather warnings in force: the US National Weather Service feed works (for example California 21 warnings, Florida 8, Texas 3). A national count is built by asking every state and Washington D.C. and adding them up. If any state fails to answer, the card shows no figure instead of a partial count.

**Canada** — one new card
- Official weather warnings in force, from Environment and Climate Change Canada's open data: **191 warnings live right now**, with the warning names ("snowfall warning", "fog advisory"), the risk colour and the province. This replaces the card that currently says "No live feed".

**Stays honestly empty**
- Australia's cash rate (the Reserve Bank blocks automated access — 403) and Australia's warning feed (every address I tried returns 404 or is blocked). Both keep their "No live feed" card with the official page linked.

## Also in this round
- A one-line note on the two US crime cards explaining why the latest month shown is a year old — police forces report late, so recent months are incomplete. Without the note the gap looks like a mistake.
- Publish to ukstats.co.uk once the checks pass.

## Still needing you (I can't do these)
- Google Search Console — needs your Google account connected.
- The GitHub repository's description, website link and topics — only editable on GitHub itself.
- The crypto donation addresses for /support, whenever you want them live.

## Technical detail

New sources, all verified returning data:
- `ABS,CPI_Q,1.0.0/3.999903.20.50.Q` (12-month CPI rate of change, All groups, seasonally adjusted) and `ABS,AWE,1.0.0/1.1.3.7.E.10.AUS.S` (average weekly earnings) — both parsed by the existing `parseSdmxCsv`, no new parser needed. `au-cpi` moves from `NO_FEED` to `DEFS.au`; `au-earnings` is new.
- Treasury `v2/accounting/od/avg_interest_rates` filtered to `security_desc` = "Total Interest-bearing Debt"; BLS series `CUUR0000SAM` (core) and `CUUR0000SAH1` (shelter) through the existing `bls()` + `yoyFromIndex()` path.
- Canada: `https://api.weather.gc.ca/collections/weather-alerts/items?limit=500` — GeoJSON. New pure parser `parseEcccAlerts` in `src/lib/national.ts` (count, worst `risk_colour_en`, most common `alert_name_en`, province spread), wired in `src/lib/national.server.ts` so `ca` gets a real alerts card instead of the `alertSlug: null` no-feed state.
- US: `https://api.weather.gov/alerts/active?area=XX` aggregated over the 50 states plus DC, parallel with a 10-minute cache and the existing 20s timeout; all-or-nothing — any failed state means no figure. `PLACES.us.alertSlug` stays null; the US alerts card is built by a dedicated branch.
- Tests: one per new parser/asserting concrete values from the probes (3.6% for 2026-Q2, $1,875.90, 3.531%, the ECCC colour/name aggregation).
- `AGENTS.md` gains one rule: national warning feeds are aggregated all-or-nothing, never partial, so a count on the page is always a complete national count.
- Checks: `bunx vitest run`, `bun run typecheck`, then publish.
