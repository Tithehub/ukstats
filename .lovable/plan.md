# Hide horse racing from the live site, then rebuild the new stream to match your Globe Orbit video

## Part 1 — Keep horse racing off the live site until you say so
- Remove every racing link from the menu, the UK topic bar and the home page on the live site.
- On ukstats.co.uk, stats.solutions and the published lovable.app address, every /racing page shows "Page not found". The pages are also removed from the sitemap and marked so Google doesn't index them.
- In the preview, racing keeps working exactly as now (dashboard, racecards, AI Predictor).
- One switch turns racing back on when you say "launch racing".

## Part 2 — The new stream, built to look exactly like your 32-second video
Applies only to the new stream at /globe/broadcast?layout=orbit. The old live stream is not touched or mixed in.

The frame is 1920×1080 and laid out like the video:
- **Top left:** a red "UKSTATS" badge with "LIVE" beside it.
- **Left column:**
  - A "NEXT UP" rail with an icon and time for each item (UK debt, small boats, weather and so on, from the real running order). The current item gets a yellow highlight and an "ON NEXT" tag, and they slide up as the show moves on.
  - Below it, the sponsor card with a large QR code. It flips between real approved sponsors and the recommended cards, one at a time.
- **Centre:** the brunette presenter behind the glass desk. She's animated the whole time: her mouth moves in time with her voice (or a speaking rhythm when muted), she breathes, sways gently, blinks and her head moves slightly. She reads the real scripts.
- **Background right:** a full 3D globe that never stops moving:
  - It rotates slowly, twinkling city lights shine on the night side, and a glowing blue rim surrounds it.
  - Red light streaks sweep around orbit lines, and pulse rings pop over the place being reported.
  - It flies to each country in the world segment and back to the UK for UK segments, while the live coordinates in the top corner update.
- **Right:** the "WORLD HEADLINE" card (it becomes "UK DEBT", "SMALL BOATS", "WEATHER" and so on per segment).
  - A title and the real figure count up and land exactly on the published value, with the change versus last period in green or red only when the publisher gives it.
  - A source and date line sits underneath.
  - The card flips to the next figure or headline every few seconds, with a light sweep.
  - Extra figures appear as small animated tiles that slide in beneath it.
- **Lower third:** a red "UK STATS LIVE" block, then a yellow segment name (WORLD / UK / WEATHER / WARNINGS) that wipes in on each change, with a shine running across it.
- **Bottom:** a yellow "BREAKING NEWS" tab with a non-stop scrolling ticker of real headlines (official warnings marked red), and a red box with the live London clock.

Everything keeps moving for the whole loop. There are no frozen or static frames, every panel has an entrance, idle motion and an exit, and nothing shows placeholder text. If a segment has no published figure, it shows a headline or is skipped, as now.

How I'll check it: 8 still screenshots across the loop (UK, debt, boats, weather, warnings, world ×2, sponsor), checked against your video for layout, overlaps, blank panels and mid-count figures. I'll also do one short 20-second screen recording to confirm the motion and her talking. No long recordings unless you ask.

## Technical details
- Racing: add `src/lib/racing/visibility.ts` with `RACING_PUBLIC=false` and a strict preview-host classifier (id-preview/preview/live-- patterns on lovable.app). This gates links in SiteHeader, UkTopicNav and index.tsx, adds a shared racing route `beforeLoad` that throws notFound() on public hosts, a noindex head, and excludes racing from the sitemap. Record the rule in AGENTS.md.
- Orbit: restructure the BroadcastView orbit variant into fixed grid zones matching the reference.
  - OrbitBackdrop gets night lights, rim glow, orbit-line streaks and a vignette over the existing three-globe globe, keeping the fly-to-country behaviour.
  - New OrbitHeadlineCard replaces the tile grid as the hero card, with a mini-tile strip.
  - The OrbitRail gets icons and times and the ON NEXT highlight, plus a sponsor card component, lower-third and ticker components.
  - CountUp snaps to the final value on a wall-clock timer, and countUp() passes multi-number strings through unchanged (with tests).
  - Add blink and head-motion to OrbitPresenter.
