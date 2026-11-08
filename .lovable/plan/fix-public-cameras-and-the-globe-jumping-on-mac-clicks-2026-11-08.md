# Fix public cameras and the globe jumping on Mac clicks

## What's wrong (checked)
- **The camera pictures themselves are fine.** TfL and California pictures and videos load from another website without being blocked.
- **The camera dots are too small to hit.** On a trackpad, the click usually lands on the country underneath instead.
- **That's what makes the globe jump.** Clicking a country flies the camera to that country at a set height, which looks like a reset. A small trackpad drag followed by a tap also counts as a click, so just moving the globe can set it off.
- **Hovering only shows text**, not the camera picture.

## Fixes
1. **No jumping when you move the globe:** a click only counts if the pointer barely moved since you pressed. Drags and two-finger swipes never pick a country.
2. **No zooming out when you pick a country:** if you're already zoomed in closer, the globe turns to the country but keeps your zoom.
3. **Bigger camera dots:** easier to hit, and they get a bit bigger as you zoom in.
4. **Hover preview:** pointing at a camera shows a small live picture with its place and operator, plus "Click to open".
5. **Clickable camera list:** when Public cameras is on, the side panel shows a **"Cameras"** list for the picked country (London cameras for the UK, California for the US). Each one is a button that opens the viewer and turns the globe to that camera. Search box to filter by road or place. If the country has none: "No public cameras for this country yet".
6. **Viewer:** Next and Previous buttons to step through nearby cameras, and an "Open on operator's site" link. It keeps its existing labels ("Still picture, updates every N minutes" / "Short video loop", "Scene only").

I'll check it in a test browser: move the globe without it jumping, hover a camera to see its picture, open one from the list and from a dot.

## Technical details
- EarthGlobe: track pointerdown position; ignore onPolygonClick / onPointClick when moved > 6px. Selected-country fly-to uses min(currentAltitude, 1.6).
- Camera points: pointRadius ~0.18 scaled by altitude; pointLabel returns HTML with `<img>` using camImageSrc (still image only, lazy).
- GlobeExplorer: camera list panel (cams within the selected country by operator mapping: united kingdom → TfL, united states → Caltrans), capped at 200 rows with search; selecting sets camId and focus to the camera's lat/lng.
- CamViewer: prev/next by distance from the current camera.
