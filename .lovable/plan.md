# Two-hour UK block, one-hour world block, no silent gaps

## New clock (London time, repeats every 3 hours)
```text
Hour A  UK part 1  – current UK running order (headlines, foreign aid, asylum cost, boats, debt...)
Hour B  UK part 2  – "In depth": longer slots, every published figure in each topic
Hour C  Rest of world – countries five minutes each, as now
```
Starting point anchored to the London clock, so a reload always lands on the same slot.

Unchanged in every hour: the "About UKStats" promos at :00/:15/:45, the two 60-second sponsor breaks (about :15:40 and :45:40), and the :30 explainer, Site Tour walkthrough and globe tour.

## UK part 2 – "In depth"
Uses only figures already on the site (no new or estimated numbers). Each topic gets more time so the presenter reads all its published figures with source and date, instead of the top few:
- Small boats and irregular migration (latest day, year to date, year-on-year)
- Debt, deficit and economy
- Cost of living
- Crime
- NHS
- Foreign aid and cost of asylum
- Population, housing, defence and terror threat, politics, legal
- Headlines at half past and a closing recap
Topics with fewer figures read each line once and then hand over to the next topic, so nothing repeats.

## No voice breaks
Today the presenter can go quiet when she finishes a line before the screen moves on, or when a voice clip fails to load. Fix:
- When a line finishes and the screen hasn't changed, she goes straight to the next queued line (or a short spoken "on ukstats.co.uk now…" bridge for that topic) rather than waiting in silence.
- If a voice clip fails, retry once, then move to the next line rather than miming silently.
- Every slot (UK, world, sponsor, promo, explainer) must have at least one spoken line; a test checks the whole 3-hour cycle for any minute with nothing to say.

## Technical details
- `stream-schedule.ts`: `positionAt` returns `mode: "uk"` with `ukPart: 1 | 2` for `hourIndex % 3` 0/1, `"world"` for 2; `worldCountryAt` uses `Math.floor(hourIndex / 3)`; odd/even alternation (education/happiest) uses the 3-hour cycle index.
- New `UK_DEEP_HOUR` table + `buildUkHour(segments, hourIndex, part)`; part 2 uses full `readingList` per topic.
- `Presenter.tsx` / `OrbitPresenter.tsx`: on audio end with unchanged line, speak next `upcoming` item; one retry on failed fetch.
- Tests: hour mapping (UK, UK, world), sponsor/explainer times unchanged in all three, no unvoiced minute across the cycle. Existing running-order tests updated.
- Rented streams keep their current schedule.
- Needs publishing; OBS refreshes itself within about 5 minutes.
