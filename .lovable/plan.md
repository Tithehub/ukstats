# Stop the humming on the live stream

The hum is the stream page's own background "newsroom drone" (a low synthesised tone that plays constantly), plus a radar ping every 4 seconds. It isn't a fault in OBS or YouTube.

## Change
- Turn the stream's sound off by default: no drone, no ping, no chime. The stream becomes silent.
- Sound only plays if someone deliberately adds `?sound=on` to the stream address (so it can be brought back later without rebuilding).
- Remove the drone entirely from the sound code so it can never come back by accident; keep only the short segment-change chime for the optional `?sound=on` mode.

## After publishing
- Publish to ukstats.co.uk.
- In OBS, double-click the UKStats browser source and click "Refresh cache of current page". The hum stops immediately.
- Quick fix right now, before publishing: in OBS's Audio Mixer, mute the UKStats browser source.

## Technical
- `src/lib/stream-audio.ts`: delete the drone oscillators/LFO and the 4s ping interval.
- `src/routes/globe_.broadcast.tsx`: start audio only when `sound=on`.
- Update the stream-audio note in AGENTS.md if present.
