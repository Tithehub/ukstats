# Switch home page live stream

Replace the current live stream (1I3R93opChA) with the new one, cB8_dNZp5kA, on the home page "UK Live" player and the /live page.

## Steps
1. Change the live stream ID in the shared brand settings, so both players update together.
2. Check with YouTube that the new video allows embedding.
3. Open the home page in the preview and confirm the player loads the new stream.

Nothing will be published until you approve it.

## Technical details
- `src/lib/brand.ts`: `LIVE_STREAM_ID = "cB8_dNZp5kA"` (the `si=` share parameter is dropped).
