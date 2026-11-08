# Point "Watch on YouTube" to the UKStats channel

- In the live stream panel on the home page (and /live, which shares it), change the "Watch on YouTube" button so it opens https://www.youtube.com/@ukstatsglobal in a new tab instead of the single stream video.
- Also point the "Back shortly — Open YouTube" fallback (shown when the stream can't play) to the same channel.
- The tracking part of the link (`?si=...`) is dropped; it isn't needed and the channel opens the same.

## Technical
- Add `YOUTUBE_CHANNEL_URL` to src/lib/brand.ts and use it in src/components/LiveStreamPanel.tsx for both links. The embedded player keeps using LIVE_STREAM_ID.
