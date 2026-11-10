# New stream running order (your decisions applied)

## What changes on the stream
1. **Spending goes first after the top story**: Foreign Aid total spend, then Cost of Asylum. Both use only published official figures with source and date shown. If asylum cost isn't published in a current figure, the slot says "Not published" with the source link, and does not make up a number.
2. **Nine new sections** go into the UK hour: foreign aid, cost of asylum, gold reserves, tax vs welfare, council spending, safest places, happiest places (alternating hourly with education), online speech.
3. **Top recent scandals + Grooming Gangs Inquiry**: a short voiced explainer per item, labelled "Background, not official statistics", showing no figures, ending with "For the full story, go to ukstats.co.uk". The newest few scandals are chosen by date.
4. **Sponsor breaks**: two 60-second breaks per hour (at about :15 and :45). Already in place, kept as-is.
5. **Presentation & explainer at :30**: the About UKStats explainer, the Site Tour walkthrough video, and a new **interactive globe explainer** where the presenter talks through the real globe's layers and key.
6. **Everything voiced**: every headline is read aloud, and every section, break and tour has a presenter line, so there are no silent sections. Muting is still possible with `?voice=off`.

## Not changed
Old classic stream, rented/white-label streams (no scandals or Restore Britain items there), and nothing gets published until you say so.

## Technical details
- `stream-schedule.ts` UK_HOUR: insert `foreign-aid`, `asylum-cost` after `top-story`; add new slots with an hourly `alt` rotation (education/happiest); add `scandals` and `inquiry` slots using `scandals.data.ts` sorted by date (top 3), via a new segment builder in `stream-rundown.ts` with no metric cards.
- Globe explainer: new chapter in `stream-explainer.ts` after the walkthrough chapter; update `EXPLAINER_LEN` and the existing equality test.
- Voice coverage: add `scriptForCard` lines for headline cards, sponsor breaks and the scandals; add a test asserting every slot/card in an hour produces non-empty spoken text.
- Tests: order (foreign aid then asylum first), two 60s breaks, alternation by hour, scandals carry no figure, full voice coverage. Preview check of the broadcast page after.
