# Voiced explainer demo + walkthrough, then add to the live stream

## What you get
1. **Demo video with voice** (for you to check first): `ukstats-explainer-demo.mp4` in Files, about 4 minutes, 1920×1080.
   - Part 1: the About UKStats explainer as it plays on the stream, with the presenter speaking her real script in the same voice the stream already uses, and her mouth moving in time with it. This includes the real globe tour with its keys, the PDF reports, Rent UKStats, where the stats come from and the sports teaser.
   - Part 2: the light-mode site walkthrough, with the presenter's voice reading a short new script over it. For example: "Here's the home page… search any figure… download today's report…". The script uses only the existing prices and page names, with no new figures.
   - A soft fade joins the two parts. The end card shows ukstats.co.uk and @ukstatsglobal.
2. **After you approve the demo:** the walkthrough plays inside the hourly About UKStats break on the stream, after the globe tour and before the sign-off. During it, the presenter appears in a small corner panel while the walkthrough fills the screen, and she reads the same script live.
   - The hourly break gets about 60 seconds longer, and the regular stats slots around :30 move up to make room.
   - This changes the stream you broadcast through OBS, so nothing goes live until you say "publish".

## Technical details
- Voice: reuse the existing presenter voice route and voice id for each scripted line. Save the audio clips in /tmp, then line them up with the chapter timings, so they don't depend on browser autoplay. Use the clip lengths to set each chapter's length, so the timings never cut her off.
- Capture: same frame-by-frame method as walkthrough v2, run at 1920×1080 on `/globe/broadcast?segment=explainer&voice=off`, with clock-driven timing so audio and picture stay locked. Mix the voice with ffmpeg (AAC 192k, loudness normalised to -14 LUFS).
- Stream integration (after approval):
  - Copy the walkthrough MP4 into project assets via lovable-assets.
  - Add a "walkthrough" chapter to `src/lib/stream-explainer.ts` with its script lines.
  - BroadcastView plays the video muted with the presenter picture-in-picture.
  - Update `EXPLAINER_LEN` in stream-schedule.ts and the tests for chapter timing and the total length.
- Checks: contact sheet of frames, an audio waveform check that every line is spoken without cut-offs, and tests run. Nothing is published.
