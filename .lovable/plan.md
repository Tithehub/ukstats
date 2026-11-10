# Smoother site walkthrough video (v2)

Re-record the walkthrough so movement is smooth. Same pages, same order, same end card, no voice. The website stays unchanged and nothing is published.

## What changes for you
- Scrolling glides and eases in and out, with no jumps or stutters.
- No speed-up after recording, so motion plays at its natural pace.
- Soft fades between pages instead of hard cuts.
- Each page waits until it has fully loaded (images, globe, figures) before it appears, so nothing pops in on screen.
- Time is shared out more evenly: home about 15s, globe about 15s, stats list about 10s, reports about 10s, Rent about 10s, end card about 5s. That makes about 65–75 seconds in total.
- Saved as a new file, `ukstats-site-walkthrough_v2.mp4`, at 1920×1080. The first version stays in Files.

## Technical details
- Frame-by-frame capture instead of live screen recording: for each frame, set the scroll position on an ease-in-out curve, wait one animation frame, then screenshot. This gives an even 30 fps with no dropped frames.
- Before capture: preload each page, wait for network idle and fonts, and pre-scroll the page once so lazy images load. Turn off the site's own smooth-scroll and any stray animations during capture.
- Globe: let it render for a few seconds, then capture the rotation and layer toggles frame by frame, with the camera opened only if a public camera with real live video is available.
- Put it together with ffmpeg: H.264 high quality (CRF 16), 60 fps output using motion-blended frames, and 0.5s crossfades between pages.
- Check: look at a contact sheet of frames and measure how far each frame moves from the last, so I can find and fix any leftover jumps before sending.
- Scripts and frames stay in /tmp; only the final MP4 goes to Files.
