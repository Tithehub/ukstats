# Make the globe work on your Mac

## What's happening
Your Mac's Chrome is refusing to let any website use 3D graphics, which is what the current globe needs. That's why it shows a message instead. We'll stop relying on that.

## What we'll build
A second version of the globe drawn with ordinary 2D drawing, which every browser allows. It looks and behaves like the real thing:
- A round, spinning Earth you can drag to turn, scroll or pinch to zoom, with day and night shading and a soft blue edge glow.
- Same country colours for warnings and stats, and the same US and UK travel-advice layers.
- Same riot, protest and warning markers, boats, migration arrows, earthquakes, weather, cameras, news pins and planes (as dots).
- Clicking a country or marker opens the same side panel and details; Search, Layers, Cameras and Key work as normal.
- It turns to a country when you pick one, just like now.

It switches on automatically whenever a browser blocks 3D. No message, no button needed. Everyone else keeps the current globe exactly as it is.

What it won't have: clouds, ocean glint and 3D flight paths, because those need the blocked graphics.

## Checks
- In the test browser, block 3D on purpose and confirm the round globe appears on the homepage and /globe on desktop and phone, spins, zooms, and country/marker clicks work.
- With 3D allowed, confirm the normal globe still loads.
- Check your open Mac tab after the change.

## Technical details
- New `src/components/globe/CanvasGlobe.tsx`: Canvas 2D orthographic projection of `world-atlas/countries-110m.json` via `topojson-client` (already installed); hand-written orthographic projection + back-face clipping in pure `src/lib/ortho.ts` with vitest. Same props as EarthGlobe; 3D-only props ignored. Drag rotate, wheel/pinch zoom per non-passive listener with delta-scaled zoom; hit-testing for countries and markers.
- `GlobeExplorer.tsx`: when `webglProblem()` or the boundary fails, render CanvasGlobe instead of the text fallback (keep a small "Simplified globe" note in the key).
- AGENTS.md rule: browsers without WebGL get CanvasGlobe fed by the same layer data, never different sources.
