# Show the new live stream on the home page

- Swap the stream on the home page's live stream box (and anywhere else that shows the UKStats live stream) to your new broadcast: youtube.com/live/3_oMefI7GL4.
- It stays muted by default, with the same layout and "Watch on YouTube" link.
- Also finish the presenter-voice fix from the last step, so the site builds cleanly again.

## Technical notes
- Change `LIVE_STREAM_ID` in src/lib/brand.ts from `DD4hgjN1KZc` to `3_oMefI7GL4`. Every embed reads this single value.
- Check the build log, then load the home page in the preview and confirm the embed points to the new video.
- Publish to make it live on ukstats.co.uk.
