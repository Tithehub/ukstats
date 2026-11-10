# Switch the home page live stream to the new broadcast

- Change the site's live stream video from the current one to `1I3R93opChA`, the link you sent.
- This updates the player on the home page and on the /live page, because both read the same setting.
- "Watch on YouTube" buttons still go to the @ukstatsglobal channel.
- I'll check the preview player loads the new video. It reaches visitors once you publish.

## Technical details
- `src/lib/brand.ts`: `LIVE_STREAM_ID = "1I3R93opChA"`.
