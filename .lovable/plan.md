# Fix the new Orbit stream so it looks like the example (preview only, nothing published)

## What was wrong in the stills I sent
1. **Figures show "0", "£0bn" and "0.0%"** instead of the real numbers. The count-up starts at zero and froze there.
2. **No globe** in the first six frames. It's just navy with lines.
3. **The bottom label is cut off**: "UK STAT", "BOUT UKSTATS".
4. **The NEXT UP rail is half-empty or blank** in several frames.
5. **The presenter is covered** by the sponsor and inquiry cards, and the screen says "voice off".
6. **The small tiles are unreadable**: tiny text, all "0".
7. **The scrolling ticker starts mid-word**, with text running under the clock.

## The fix
1. **Real numbers straight away.** Every figure shows its real published value from the start. Any animation only adds movement; it can never change the number. If a value is missing, the tile is dropped. It never shows "0".
2. **The globe is always visible.** It shows from the very first frame during About/sponsor breaks too, not only in figure segments.
3. **The bottom label always fits.** It sizes to its text and never clips.
4. **NEXT UP always lists the next three items**, wrapping round to the start of the running order, so it's never blank.
5. **Clear layout zones**, like the example: presenter in the centre and never covered, sponsor/inquiry cards on the left, the figure card on the right. The "voice off" tag is hidden on the broadcast view.
6. **Bigger, fewer tiles.** Up to three tiles, readable at TV size, each with the real value and its source.
7. **Ticker fixes.** It starts at the beginning of a headline and stops before the clock.

## How I'll check it (cheap, no video recording)
- I'll take one still of each segment: About, sponsor, UK debt, small boats, crime, cost of living, weather, warnings, headlines and world.
- I'll look at every still myself before sending.
- I'll send you one contact sheet. I'll only send it if none of the problems above are visible.
- No video recording this round. You record a minute in OBS on your computer once you're happy with the stills.

## Not changing
- The old live stream, the site, the published domains and racing stay as they are. Nothing gets published.

## Technical notes
- In `OrbitScene.tsx`, render the formatted published value as the base text, with the count-up as an optional overlay. Filter out tiles whose value is null.
- Mount the globe layer for all segment kinds. Lower-third uses `width: max-content` with a max-width and ellipsis guard. The NEXT UP rail is computed from the rundown with modulo wrap.
- Playwright stills come from `?layout=orbit&at=<segment>` (or a clock offset) at 1920x1080 with `?voice=off`.
