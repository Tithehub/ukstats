# Two-hour UK block, one-hour world block, no silent gaps

## New clock (London time, repeats every 3 hours)
```text
Hour A  UK part 1  – current UK running order, unchanged
Hour B  UK part 2  – same running order, presenter goes deeper into each topic's figures
Hour C  Rest of world – countries five minutes each, as now
```
Anchored to the London clock, so a reload always lands on the same slot.

Unchanged in every hour: the "About UKStats" promos, the two 60-second sponsor breaks (about :15:40 and :45:40), and the :30 explainer, Site Tour walkthrough and globe tour.

## UK part 2 – same format, deeper
Same running order, topics, screens and layout as UK part 1. The only difference: in each topic the presenter reads every figure the site already publishes for it (with source and date), not just the top few. No new or estimated numbers. Topics with fewer figures read each line once and then hand over, so nothing repeats.

## No voice breaks
The presenter can currently go quiet when she finishes a line before the screen moves on, or when a voice clip fails to load. Fix:
- When a line finishes and the screen hasn't changed, she goes straight to the next queued line (or a short spoken pointer to that topic on ukstats.co.uk) instead of waiting in silence.
- If a voice clip fails, retry once, then move to the next line rather than miming silently.
- Every slot (UK, world, sponsor, promo, explainer) has at least one spoken line; a test checks the whole 3-hour cycle for any minute with nothing to say.

## Technical details
- `stream-schedule.ts`: `positionAt` gives `mode: "uk"` with `ukPart: 1 | 2` for `hourIndex % 3` 0/1 and `"world"` for 2; `worldCountryAt` and the education/happiest alternation use `Math.floor(hourIndex / 3)`.
- `buildUkHour` unchanged; in part 2 `readingList` includes every published figure line per topic.
- `Presenter.tsx` / `OrbitPresenter.tsx`: on audio end with unchanged line, speak the next `upcoming` item; one retry on failed fetch.
- Tests: hour mapping (UK, UK, world), sponsor/explainer times unchanged, no unvoiced minute across the cycle; existing running-order tests updated.
- Rented streams keep their current schedule. Needs publishing; OBS refreshes itself within about 5 minutes.
