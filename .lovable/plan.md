Switch the homepage live player and every "Watch live" button to the new YouTube stream (DD4hgjN1KZc), then publish so it shows on ukstats.co.uk.

## Steps
1. Swap the stream ID from 07JGTMqywjc to DD4hgjN1KZc. It's set in one place, so every link and the player change together.
2. Publish the site.
3. Open the live homepage and check the player and Watch live link point to the new stream.

## Note
The player on the site only works if "Allow embedding" is switched on for this stream in YouTube Studio. If it's off, visitors will see a "watch on YouTube" message in the player.

## Technical
- `src/lib/brand.ts`: `LIVE_STREAM_ID = "DD4hgjN1KZc"`.
