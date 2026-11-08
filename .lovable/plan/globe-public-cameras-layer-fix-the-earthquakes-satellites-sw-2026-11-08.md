# Globe: public cameras layer + fix the Earthquakes/Satellites switches

## 1. Fix: Earthquakes and Satellites won't tick (home page globe)
Cause (confirmed in the code): the home page globe keeps its own list of which switches are on, and that list was never told about Earthquakes and Satellites. Clicking them is ignored, so the tick never appears. The /globe page doesn't have this problem.
Fix: add both switches to the home page's list so they tick and the layers appear. Check both pages in a test browser.

## 2. New "Public cameras" layer on the globe
A new switch under Layers: **Public cameras**. Each camera is a small camera pin on the globe; click one to open a viewer in the country panel with the picture, place, operator, licence and "last updated" time.

Only cameras run by public authorities that publish them as open data — no private, police or home CCTV, and no copied news footage.

Sources, all free with no key:
- **Transport for London JamCams** — about 900 London road cameras (short video loops, updated every few minutes).
- **New York City DOT** — about 900 traffic cameras.
- **Caltrans (California)** — about 2,000 highway cameras, some with live video.
- **Washington State DOT** — about 1,500 cameras.
- **Ontario 511 (Canada)** — about 800 cameras.
- **NASA ISS live view** — Earth from the space station (official NASA YouTube live).

That's several thousand cameras to start. More countries can be added later, but only after each publisher's terms are checked.

**Honest labelling:** most of these are still pictures that refresh every 1–5 minutes, not continuous video. Each viewer says "Still picture, updates every N minutes" or "Live video", plus "Scene only — not a source of figures". Cameras that stop answering are greyed out, not hidden behind a stale picture.

Busy areas cluster into one numbered pin when zoomed out so the globe stays fast.

## Technical details
- Bug: in src/components/home/UkLanding.tsx add "eq" and "st" to the layers state type and to the key list in onChange's reduce.
- New src/lib/public-cams.ts (pure parsers per publisher + tests) and src/lib/public-cams.functions.ts (POST server fn, fetch all feeds in parallel, cached in payload_cache "public-cams-v1" with 6h TTL for camera lists; picture URLs load directly from the publisher in the browser).
- GlobeExplorer: "cam" switch in parseGlobeExtras, camera pins via existing marker layer with simple grid clustering, viewer panel reusing the stream-camera labelling.
- Rule recorded in src/lib/AGENTS.md: only public-authority open-data cameras, labelled scene only, never figures.
