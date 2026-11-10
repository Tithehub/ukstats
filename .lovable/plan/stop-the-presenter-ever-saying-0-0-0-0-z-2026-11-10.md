# Stop the presenter ever saying "0 0 0 0 Z"

## What's going on
Every line is already cleaned before she says it. The clean-up turns full computer-style dates such as "2026-11-10T00:00:00Z" into words. It misses a time written apart from its date. For example, "2026-11-10 00:00Z" becomes "the tenth of November, twenty twenty-six 00:00Z", and the voice then reads "zero zero zero zero Z". Times such as "0000Z", "00:00 UTC" and "+00:00" also get through. The second UK hour reads each figure's extra detail and reference period, so it's where these show up.

I haven't yet found which figure carries the odd time. The voice records don't keep the words she was given. The fix doesn't depend on finding it.

## What I'll change
1. **Remove every leftover time code:** times followed by Z or UTC, four-digit codes like "0000Z", time-zone offsets like "+00:00", and any stray Z after digits. She never reads clock times, so nothing she should say is lost.
2. **Final safety net:** if a sentence still contains anything that looks like a time code or a run of zeros, she skips that sentence and reads the rest of the line. The same check runs again just before her voice is made.
3. **Checks against real figures:**
   - Build every line of both UK hours from the figures the stream is using now, and confirm none contains a time code or a run of zeros.
   - Fixed examples that must come out clean: "00:00Z", "0000Z", "2026-11-10 00:00Z", "12:00 UTC" and "+00:00".

## Not changing
How dates are said ("the tenth of November, twenty twenty-six"), what's on screen, the timings and the running order.

## After you publish
OBS picks up the change within about 5 minutes. To switch straight away, refresh the browser source.

## Technical details
- `speakable()` in `stream-script.ts`: add strip rules for `\b\d{1,2}:\d{2}(:\d{2})?(\.\d+)?\s*(Z|UTC|GMT)?\b`, `\b\d{4}Z\b`, `[+-]\d{2}:\d{2}\b`, and `(?<=\d)Z\b`. Then split into sentences and drop any sentence still matching `/\d{2}:?\d{2}\s*Z|\b0{3,}\b|\bZ\b/`.
- The server `speakLine` already calls `speakable`, so it gets the same guard.
- New test reads the current `uk-stats` snapshot shape through `buildUkHour` and `readingList(seg, true)`.
