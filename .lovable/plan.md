# Full example video of the new Globe Orbit stream

## What you'll get
One MP4 file in Files, about 3–4 minutes long, made by recording the new stream itself (not mockup pictures). It runs through the whole running order once:

1. UK opening: real UK stats tiles counting up, globe on the UK
2. UK debt, small boats and crime segments: tiles glow as each one is read, trend lines draw in
3. Weather: globe tilts to the UK with forecast tiles
4. Government warnings: red-framed card with the government's own wording, country flashing on the globe
5. Headlines: headline cards flipping, labelled news or official
6. World segment: the globe turns to 3–4 countries in turn, each with its own real figures
7. Sponsor break and "About UKStats" break with QR code
8. Back to the UK opening, so it loops

The brunette presenter moves her mouth and sways throughout, and her voice reads the real scripts, so you can hear her in the video.

## Notes
- Only real published figures and headlines appear, because it records the real stream.
- The live stream and the site stay unchanged.
- Before sending it, I'll check frames from every segment for overlaps, blank tiles and the odd "17.870" figure, and fix the stream view if something's wrong.

## Technical details
- Record /globe/broadcast?layout=orbit at 1920x1080 with headless Chromium video capture, stepping the schedule through each segment with a test-only time override (dev/preview only) so the full loop fits in a few minutes.
- Capture presenter speech audio from the voice service and mux with ffmpeg; trim to a clean loop point.
- Save to /mnt/documents/ukstats-orbit-full-loop.mp4.
