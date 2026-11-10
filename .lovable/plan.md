# Stop "0 0 0 0" for good and lock her voice to the on-screen stats

## What's causing it
- **"0 0 0 0":** the live site still has the old version that reads raw computer dates (the fix is only in the preview). A few other figures also carry raw dates in their "period" (for example the weather forecast date "2026-11-10"), which she would read digit by digit in the second UK hour.
- **Drift:** the screen moves to the next stat every 9 seconds by the clock, but she finishes each line in her own time. Second-hour lines can take 25–30 seconds, so she falls further and further behind the screen, and her extra lines keep running ahead of it.

## Fix
1. **No raw dates or codes ever spoken:** one last check on every line before it goes to the voice. Any date in computer format becomes words ("10 November 2026"); anything still unreadable (long digit runs, "T00:00", "Z") is removed. Applies to stats, headlines, scandals, sponsor breaks and the explainer.
2. **Screen time matches speaking time:** each line gets its own time on screen, worked out from its length (about 2.6 words a second, minimum 6 seconds). Screen and voice both use this same timetable from the London clock, so a reload still lands on the same line.
3. **The screen leads; the voice follows:** when the screen moves on, she stops the old line straight away and starts the line now showing. She never runs ahead of or behind the screen.
4. **No silence:** her existing gap-fillers stay, but only within the current line's time.
5. **Slot lengths unchanged:** sponsor breaks, :30 explainer and slot start times stay where they are; if a slot's lines don't all fit, the last ones are dropped rather than overrunning.
6. **Checks:** automatic tests that no spoken line contains raw date text, and that the line on screen and the line being spoken are always the same at any moment of the hour. Then I'll watch the stream in the preview with the voice on, through a second-UK-hour slot, and report what I saw and heard.

## Technical details
- `stream-script.ts`: `speakable(text)` applied in `readingList`, `scriptForCard` (period too), headlines, promo, sponsor and explainer lines; also inside `speakLine` server-side as a last guard.
- `stream-schedule.ts`: `lineTimeline(reads, slotMs)` → `{index, msInLine}`; replaces `cardStep(msIn)` for the reading step in `BroadcastView` (both Orbit and classic); cards/headlines index from it.
- `OrbitPresenter`/`Presenter`: on `line` change, pause and drop current audio and speak the new line; queue-ahead (`nextLine`) limited to the bridge while the same screen line is still showing.
- Tests in `stream-running-order.test.ts`.
