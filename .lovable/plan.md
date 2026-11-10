# Walkthrough video inside the live stream's About UKStats break

## What changes
- Stop making the demo recording. No video with the presenter in it is needed.
- In the hourly About UKStats break (at :30), after the sports teaser and before the sign-off, the light-mode site walkthrough plays inside a screen on the right of the studio. The presenter stays in her normal place at the desk and talks over it.
- Each line she reads matches the page on screen: home page, globe, statistics list, PDF reports (real prices), then Rent UKStats. The walkthrough video has no sound of its own.
- Each line now gets its own time on air, measured from her real voice, so no line is cut off. The break becomes about 4 minutes long. Sponsor breaks at :15 and :45 are unchanged.
- If no public camera has real live video, she says "Try it yourself at ukstats.co.uk slash globe" instead of the camera line, so she never describes a camera that isn't shown.
- Then publish, so the next :30 break on YouTube (through OBS) shows it. OBS needs its browser source refreshed once.

## Technical details
- Already in place in the preview: per-line `lineMs` and the `walkthrough` chapter in stream-explainer.ts, `EXPLAINER_LEN` 246,670 ms, `GLOBE_NO_CAM_LINE`, the walkthrough MP4 uploaded as a stream asset, and passing tests.
- Change `WalkthroughVideo` in BroadcastView from a full screen to a framed container on the right panel (about 1100×620, glass frame, "SITE TOUR" tag, chapter title under it). Put the presenter back in her normal desk position for this chapter, and remove the corner window.
- Remove the capture-only mouth hook from OrbitPresenter, since nothing is recording.
- Video stays muted, follows the London clock (re-syncs if it drifts more than 0.6s) and loads ahead of time.
- Checks: run the tests, look at a 1920×1080 screenshot of the walkthrough chapter via `?segment=explainer` with the clock moved forward, and make sure the build log is clean. Then publish.
