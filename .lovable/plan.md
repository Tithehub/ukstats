# Fix presenter reading "0 0 0 0 Z" on the street crime card

## What's wrong
In the second UK hour the presenter also reads each figure's publication and next-update dates. Those dates are passed to the voice in raw computer format (for example "2026-09-15T00:00:00.000Z"), so she spells out the digits and the "T…Z" — that is the "0 0 0 0 zut" you heard. The street crime card is the main one with both dates, which is why it sounds stuck there; the long garbled line also keeps her on that card longer than planned.

## Fix
1. Speak dates as plain words on the London calendar, e.g. "Published 15 September 2026. Next update due 15 November 2026."
2. Apply this to every card the presenter reads, both UK hours and the world hour, so no raw date can be read aloud anywhere.
3. If a date can't be understood, leave it out of the spoken line rather than read it.
4. Check the street crime slot hands over to the next card on time, and fix the timing if it still lingers.
5. Add an automatic check that spoken lines never contain raw date text.

Nothing is published until you approve.

## Technical details
- `src/lib/stream-script.ts` `scriptForCard`: format `asOf`/`nextDue` via `fmtDate` (Europe/London) before speaking; drop invalid dates.
- Scan other spoken builders (`stream-rundown.ts`, explainer) for ISO strings.
- Test in `src/lib/stream-running-order.test.ts`: deep script for a card with ISO dates contains no `T00:` / `Z` pattern and includes "15 September 2026".
