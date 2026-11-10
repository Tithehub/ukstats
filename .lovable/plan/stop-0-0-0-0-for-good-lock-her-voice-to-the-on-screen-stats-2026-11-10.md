# Stop "0 0 0 0" for good, lock her voice to the on-screen stats, and read the gold leaderboard

## What's causing it
- **"0 0 0 0":** the live site still has the old version that reads raw computer dates; the fix is only in the preview. A few figures also carry raw dates in their reference period (for example the weather forecast's "2026-11-10"), which she would read digit by digit in the second UK hour.
- **Drift:** the screen moves to the next stat every 9 seconds by the clock, but she finishes each line in her own time. Second-hour lines can take 25–30 seconds, so she falls further behind the screen.
- **Gold reserves silent:** the stream's gold slot only points to the site page and never loads the gold figures, so it says "no figures published" even though the site's gold page shows the IMF country leaderboard.

## Fix
1. **No raw dates or codes ever spoken:** a last check on every line before it goes to the voice. Computer-format dates become words ("10 November 2026"); anything still unreadable ("T00:00", "Z", long digit runs) is removed. Covers stats, headlines, scandals, sponsor breaks and the explainer.
2. **Screen time matches speaking time:** each line gets its own time on screen, based on its length (about 2.6 words a second, at least 6 seconds). Screen and voice use the same timetable from the London clock, so a reload lands on the same line.
3. **Screen leads, voice follows:** when the screen moves on, she stops the old line and starts the one now showing — never ahead or behind.
4. **No silence:** gap-fillers stay, but only within the current line's time.
5. **Slot lengths unchanged:** sponsor breaks, :30 explainer and slot start times stay put; lines that don't fit a slot are dropped rather than overrunning.
6. **Gold reserves leaderboard:** the gold slot uses the same IMF figures as the site's gold page. Top ten countries on screen (rank, flag, country, tonnes, period), UK's rank highlighted, and she reads them out ("Number one, United States, … tonnes"). Source and period shown and spoken. Filings the site flags as implausible stay unranked. If the IMF figures can't load, she says so and points to ukstats.co.uk/gold — no numbers made up.
7. **Checks:** automatic tests that no spoken line contains raw date text, that the line on screen and the line spoken always match, and that the gold lines match the site's ranked table. Then I'll watch the preview stream with voice on through a second-UK-hour slot and the gold slot, and report what I saw and heard.

## Technical details
- `stream-script.ts`: `speakable(text)` in `readingList`, `scriptForCard` (period too), headlines, promo, sponsor, explainer; also in `speakLine` server-side.
- `stream-schedule.ts`: `lineTimeline(reads, slotMs)` → `{index, msInLine}` replaces `cardStep` for the reading step in `BroadcastView` (Orbit and classic).
- `OrbitPresenter`/`Presenter`: on line change, stop current audio and speak the new line; queue-ahead limited to the bridge.
- Gold: `goldQuery()` in `BroadcastView`; `goldSegment(table)` from `table.ranked.slice(0, 10)`; new `StreamGoldBoard` panel.
- Tests in `stream-running-order.test.ts`; add tasks to `roadmap.md`.
