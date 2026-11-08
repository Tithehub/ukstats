# Show the new live stream on ukstats.co.uk

- Swap the live stream box on the home page and the live page to your new broadcast: youtube.com/live/j2MJCjRAPHM.
- Keep the same layout, with sound on by default (a visitor still needs one click before the browser allows sound) and the "Watch on YouTube" link.
- Check in the preview that the stream plays. If YouTube blocks other websites from showing it, the box will say "Back shortly". Fix that in YouTube Studio: Content, then Live, open the stream, Show more, tick Allow embedding.
- Publish to make it live.

## Technical notes
- Change `LIVE_STREAM_ID` in src/lib/brand.ts from `3_oMefI7GL4` to `j2MJCjRAPHM`. Every embed reads this value.
- Check that YouTube allows the video to be embedded, look at the build log, and load the home page to confirm the embed points to the new video.
