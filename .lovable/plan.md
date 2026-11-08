# Show the new live stream on the home page, with sound on

- Swap the home page's live stream box, the /live page and its thumbnail to your new broadcast: youtube.com/live/3_oMefI7GL4. The "Watch on YouTube" link and the layout stay the same.
- Turn the sound on by default.
- **Browser limit:** Chrome, Safari and Firefox won't play a video with sound until the visitor has clicked or tapped somewhere on the site. To handle this:
  - The stream asks to play with sound first.
  - If the browser blocks that, it plays muted instead, with a clear "Tap for sound" button over the stream.
  - Visitors who have already clicked around the site hear it straight away.
- Finish the presenter-voice fix from the last step, so the site builds cleanly again.

## Technical notes
- In src/lib/brand.ts, change `LIVE_STREAM_ID` to `3_oMefI7GL4`.
- In LiveStreamPanel, switch the embed to `mute=0&enablejsapi=1`. After the player loads, check `isMuted()` through YouTube's iframe postMessage API. If it's muted, or autoplay was blocked, show the "Tap for sound" overlay, which sends `unMute` + `playVideo`.
- Speech fix: `getStreamVoiceLink` is now exported. Recheck the build log for the studio typing error.
- Verify in the preview that the embed uses the new video ID. Publish so ukstats.co.uk picks it up.
