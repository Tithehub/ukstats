# Flat world map when a browser can't show the 3D globe

## What we found
Both preview tabs open on your Mac now show the message "Your browser has graphics acceleration turned off or blocked…". Your Mac's Chrome (version 157) still won't draw any 3D at all, even a basic test. So the 3D globe can't show there until that Chrome setting is fixed. No change to the site can get round this, but we can show a flat map instead of the message.

## What you'll see
When a browser can't do 3D (your Mac, older laptops, locked-down work computers), the globe space shows a **flat 2D world map** instead of a message:
- Same countries, same colours for warnings and stats, and the same US and UK travel-advice layers.
- Same riot, protest and warning markers in the places named in official advice, with the same icons and colours.
- Small boats, migration arrows, earthquakes, weather and news pins wherever they have a map position.
- Clicking a country opens the same side panel; clicking a marker opens the same details.
- The same toolbar (Search, Layers, Cameras, Key) works as normal.
- A small label says "Flat map — your browser has 3D graphics turned off", with a link to turn it on and a **Try 3D again** button.
- Planes and satellites still appear as dots, but without the 3D flight paths.

Everyone whose browser can do 3D keeps the 3D globe exactly as it is now.

## Checks
- In the test browser, turn 3D off on purpose and confirm the flat map appears on the homepage and /globe, on desktop and phone, with markers and country clicks working.
- Turn 3D back on and confirm the normal globe still loads.

To get the real 3D globe on your Mac, you still need to switch on Chrome's **Settings → System → Use graphics acceleration when available** and relaunch, or try Safari.

## Technical details
- New `src/components/globe/FlatMap.tsx`: SVG equirectangular map built from the same `world-atlas/countries-110m.json` + `topojson-client` already used by EarthGlobe (no new packages). Accepts the same props as EarthGlobe (fill, labels, selected, markers, boats, flows, quakes, wx, feedPins, planes, cams, onSelect, onMarker, onPlane, onCam, onFeedPin); unsupported 3D-only props are ignored. Pan/zoom via pointer + wheel with CSS transform.
- Pure projection helper (lng/lat to x/y, antimeridian ring splitting) in `src/lib/flat-map.ts` with a small vitest.
- `GlobeExplorer.tsx`: when `gl === false`, render `<FlatMap … />` with a notice bar and "Try 3D again" (bumps `glTry`) instead of the text-only fallback. Broadcast mode keeps current behaviour.
- Add one AGENTS.md rule: browsers without WebGL get the SVG FlatMap fed by the same layer data, never different sources.
