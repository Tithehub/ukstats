# Keep the presenter in step during the :30 explainer and sponsor breaks

## What's wrong
The regular stats slots got the "finish the line before the screen moves on" fix last time. The half-past explainer (welcome, globe tour, sources, reports, rent, sports, site walkthrough, close) and the two sponsor breaks still run on their own fixed timers:
- **Explainer:** each line has a hand-set length. Several lines, such as the prices and the subscription line, take longer to say than their slot allows. The screen, the globe tour and the walkthrough video move on while she is still talking, and each delay builds on the last.
- **Sponsor breaks:** every sponsor card gets exactly 10 seconds. The first and last cards have extra words (the "brought to you by" intro and the "thank you" closing), so she overruns those cards and ends up a card behind.

## What I'll change
1. **Line lengths from the words she says.** Each explainer and sponsor-break line will get as long as it takes to say it, measured the same way as the stats slots. The walkthrough video stays tied to its own page cuts, and its spoken lines will be trimmed to fit those cuts.
2. **Finish before moving on.** The same rule as the stats slots: while she is speaking, the explainer screen, globe tour step and sponsor card stay put. A stuck clip can hold the screen for at most 25 seconds.
3. **Sponsor break fits in 60 seconds.** Shorter intro and closing wording, so the opening line, one line per sponsor and the thank-you all fit in the minute. With more sponsors, each card shows for a shorter time instead of the break running over. Sponsor names and web addresses stay exactly as approved.
4. **Explainer length.** If the corrected timings make the explainer longer, the slot after it gets less time, so headlines and the hour still start on time.
5. **Checks.** New automatic tests:
   - no explainer or sponsor line is shorter than the time needed to say it
   - the sponsor break always ends within its 60 seconds
   - the screen holds while she is still speaking

## Not changing
Her other lines, the stats slots, the running order and rented streams.

## Can't verify
I can't hear her voice in the preview. You'll need to listen in OBS at :30 and around :15 and :45 after you publish.

## Technical details
- `stream-explainer.ts`: replace hard-coded `lineMs` with `lineMs(text)` from `stream-script.ts`. Walkthrough keeps fixed video cut times and asserts `lineMs(line) <= cut`. `EXPLAINER_LEN` in `stream-schedule.ts` is derived from these lengths.
- `scriptForSponsorBreak`: card length = `max(lineMs(line))`-aware split of 60s; intro/outro shortened; test that the sum of the line lengths is at most 60,000ms.
- `BroadcastView.tsx`: route explainer and sponsor steps through `heldStep` with their own segment ids, as the stats slots do, so the speaking hold and the 25s cap apply.
