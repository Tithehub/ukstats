# Presenter reads sponsors again during sponsor breaks

## What's wrong
The two 60-second sponsor breaks (about :15 and :45) show the sponsor cards full-screen, but the presenter's speech was never linked to them. During the break the presenter keeps reading whatever section was underneath, so sponsors are never named. (The short "About UKStats" promo before each break only names sponsors once, in one line.)

## Fix
- During each sponsor break the presenter speaks a line for the sponsor currently on screen, in step with the card (each card shows for 10 seconds):
  - "This break is brought to you by our sponsors."
  - "[Sponsor name] — visit [their website]. Scan the code on screen." (name and web address exactly as approved; no claims about the business)
  - Closing line: "Thank you to our sponsors. Sponsors never choose or change our figures. Want your business here? Visit ukstats.co.uk/sponsors."
- The "Next up" rail shows "Sponsor break" while it runs.
- Applies to the UK and world hours; rented (branded) streams unchanged — they have no sponsor break.
- Old classic stream layout gets the same voiced lines.

## Technical details
- Add `scriptForSponsorBreak(rows, msIntoBreak)` in `src/lib/stream-script.ts`, timed to the same 10s rotation as `OrbitSponsor`.
- In `BroadcastView.tsx`, add a sponsor-break branch ahead of promo/regular lines for `orbitLine`, `orbitUp`, the classic `Presenter`, and the Next Up label.
- Add tests in the running-order test file: break at :15:40 and :45:40 yields the sponsor named on screen; no sponsor lines when there are no approved sponsors.
- Publishing needed afterwards; OBS refreshes itself within ~5 minutes.
