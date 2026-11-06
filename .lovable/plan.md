# World-class animated presenter (same person)

## What you'll see
- The same presenter, now moving: blinking, small head movements, breathing, hand gestures while she talks — like a real news anchor.
- She moves out of the middle box into a proper anchor spot: standing on the left of the screen, cut out against the studio, with a news-style name strap ("UKStats AI presenter · official figures").
- Two states that switch smoothly: a "listening" loop when quiet and a "talking" loop while her line plays. Clips crossfade so there's no jump.
- She stays labelled AI, and still says only the official figure lines.

## Honest limit
Her mouth movements will not exactly match the words. The video tools make the moving picture and the voice separately, so true lip-sync isn't possible this way. The talking loop gives natural speaking motion, but a close viewer may notice. I'll keep the shot medium-wide (waist up) so it reads naturally.

## Steps
1. Make 3 short clips (about 6–8 seconds each) from her existing photo: idle/listening, talking with gestures, and a talking variant. Each ends on the same pose it starts with so it loops cleanly.
2. Show you the clips first for approval before anything changes on the stream.
3. Once approved, swap the still picture for the looping clips on the stream and reposition her as an anchor on the left, without covering the Top 6, figure card, tickers or sponsor box.
4. Check at 1920×1080 and portrait that nothing overlaps, then wait for your "publish".

## Technical details
- Clips generated with image-to-video from `ukstats_presenter.jpg` (preserve face/hair/clothing, camera locked-off, no on-screen text, no audio), registered as assets, played muted with `loop` + crossfade in `Presenter.tsx`, switched on the existing speaking state.
- Generation costs credits per clip (3 clips).
