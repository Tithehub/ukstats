# Make the live globe easier to use, with real live cameras

## 1. Live camera video
- California highway cameras that publish a live video stream (Caltrans gives one for many cameras) will play **live video** in the viewer, marked with a red **LIVE** badge.
- Cameras without live video stay, clearly labelled: **"Short loop, updated every 5 min"** (London TfL) or **"Still picture, updated every N min"**.
- Live cameras are listed first in the Cameras list, with a **"Live only"** filter. Their dots on the globe are red; the others stay blue.
- If a live stream stops, the viewer says "Live video unavailable" and shows the latest still with its label. It never presents a loop as live.

## 2. Cleaner, modern layout (desktop)
- One slim **toolbar** along the top: search, Layers, Cameras, Views (Whole world / Tilted / Focus) and zoom. It replaces the scattered buttons in different corners.
- Layers become a tidy menu with grouped switches (Warnings, Movement, Nature and space, Cameras, Display), each with a count and its source in small text.
- The colour key, clocks and position box fold into one small "Info" box that you can collapse. Nothing sits in the middle of the globe.
- The country panel can be hidden with one button, so the globe can fill the screen.

## 3. Phones and tablets
- The globe fills the screen. A bottom bar has 4 big buttons: **Search, Layers, Cameras, Country**. Each opens a sheet that slides up and closes with a swipe or an X.
- Only one sheet is open at a time, so panels never pile up over the globe.
- Bigger tap targets: dots and markers get larger tap areas. Tapping a dot opens it directly, with no need to hover.

## 4. Stays still, and everything clicks
- The automatic country tour is **off by default**. A "Tour" button turns it on.
- The globe never moves by itself after you touch it. It only moves when you pick a country, a camera or a view.
- Fix clicks on dots, planes, quakes and cameras on trackpads and touch screens: a small movement while clicking still counts as a click.

## 5. Faster
- Fewer dots are drawn when zoomed out (thinned camera, flight and quake points), with the full detail as you zoom in.
- Heavy layers load only when switched on. The globe redraws less often while idle.

## Technical notes
- public-cams.ts: parse `imageData.streamingVideoURL` (https only) as `live`; add `kind: "live" | "loop" | "still"`; sort live first; unit tests for parsing and labelling.
- CamViewer: play HLS with native video (Safari) or a dynamically imported `hls.js` (others), loaded only after hydration. Fall back to the still on error. Keep the "Scene only — not a source of figures" label.
- Update the stream-cameras rule note: Caltrans HLS counts as continuous live; TfL stays a loop.
- GlobeExplorer: new GlobeToolbar (desktop) and GlobeMobileBar plus a single-sheet state (`search | layers | cams | country | null`). Merge GlobeHud and the colour key into a collapsible info box. Tour off by default (stored in the URL).
- EarthGlobe: click tolerance threshold of 6px; larger `pointRadius` hit areas on touch; thin points by altitude; `pointsMerge` for cameras when zoomed out.
- Verify with Playwright at 390, 768 and 1440 widths: open the sheets, click a camera dot, check that a live camera plays and that the globe doesn't drift for 20 seconds.
