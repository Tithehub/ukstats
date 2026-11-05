# Sharper, bolder stream and only truly live cameras

## 1. Picture quality (resolution)
The page is built at 1920x1080. The soft picture most likely comes from OBS and YouTube settings, not the page itself.
- Draw the stream page at double sharpness. Text and lines get crisp edges, with no layout change.
- Remove the dark see-through layers over the globe that make colours look washed out.
- OBS steps for the Mac:
  - Browser source width 1920 and height 1080, with "Fit to screen".
  - Settings → Video: Base 1920x1080, Output 1920x1080, 30 FPS.
  - Settings → Output: 6000 Kbps (or 9000 if the internet allows), keyframe 2, preset "Quality".
  - YouTube may take a few minutes to offer 1080p after a stream starts.

## 2. Bright, bold news-channel look
Keep the Restore Britain navy as the base, with stronger colours on top, in the style of Sky/BBC/CNN:
- Solid pure-white headline bars with heavy black text, and a solid bright red "BREAKING / MAJOR ISSUE" strap.
- A bright red LIVE badge and a yellow highlight bar on the main figure.
- Tickers: solid red LATEST strip and solid navy strip with white bold text. No transparency.
- A brighter, more saturated globe (vivid ocean blue, brighter land, glowing hotspots).
- Bigger, heavier fonts for the title, the figure and the Top 6 values.
- Colour tokens updated only for the stream page. The main site is unchanged.

## 3. Only real live footage
The Transport for London cameras are short clips refreshed about every 5 minutes, not live video, so they will be **removed** from the stream.
- No official UK body publishes free, reusable, truly live camera video. Police and council CCTV is private.
- The footage box will play a truly live feed only when one is licence-checked. Until then it shows recorded 2026 clips, clearly labelled "Recorded footage", and never the word "LIVE".
- If the user knows a live camera with reuse permission, it can be added through the same checked list.

## Technical details
- `globe_.broadcast.tsx`: render the frame at 2x device scale; drop overlay opacity; new stream-only tokens in `src/styles.css` (`--stream-red`, `--stream-yellow`, `--stream-strap`), all oklch.
- `EarthGlobe` broadcast mode: brighter globe/atmosphere colours.
- `stream-cameras.data.ts`: add a `live: true` requirement; remove JamCams (not live); `cameraForCard` returns only live entries; update tests so a non-live camera can never render with a LIVE badge.
- Update the AGENTS.md rule for stream cameras.
- Browser check at 1920x1080 and 1080x1920 for sharpness and no cut-off text.
