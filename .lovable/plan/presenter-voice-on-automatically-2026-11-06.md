# Presenter voice on automatically

I can't reach OBS on your Mac, so I'll take as many steps off your list as I can.

## What changes
- The stream page speaks on its own. You won't need to change the address or add `?voice=on`. Adding `?voice=off` silences it for anyone who wants that.
- The stream page reloads itself shortly after each update, so OBS picks up the new version without you clicking "Refresh cache". (It already reloads every 4 hours and after errors; this adds a version check every 5 minutes.)
- I'll publish once this is done.

## What's left for you, once
- In OBS, click the speaker icon next to UKStats in the Audio Mixer so it isn't muted. Only your Mac can do that.

## Technical details
- `globe_.broadcast.tsx`: voice is on unless `?voice=off`. The AGENTS.md rule wording is updated to match.
- A version check fetches the page's build id every 5 minutes and calls `location.reload()` when it changes.
