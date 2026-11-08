# Globe upgrade: "God's Eye View" style

Goal: make /globe (and the globe on the home page) feel like a live intelligence dashboard, keeping the site's rules — every marker comes from a named public source, labelled, dated, and never turned into a made-up figure.

## What visitors will see

1. **A better-looking Earth**
   - Day side and night side with a moving sunrise/sunset line and city lights at night.
   - Soft atmosphere glow, sharper Earth picture, smooth fly-to when you pick a country or pin.
   - Three camera buttons: **Whole world**, **Tilted view**, **Focus country**.

2. **Dark "control room" look** (globe page only; home page keeps current style)
   - See-through side panels, live UTC and London clocks, a readout of where your pointer is (latitude/longitude) and camera height.
   - Layer panel with an on/off switch and a count for each layer, e.g. "Earthquakes 42".

3. **New live layers** (all free, no paid accounts)
   - **Earthquakes** — US Geological Survey, last 24 hours, sized by magnitude.
   - **Fires seen from space** — NASA FIRMS (needs a free NASA key you request).
   - **Satellites** — ISS and a few well-known Earth-watching satellites, positions worked out from CelesTrak's published orbit data, with their path drawn.
   - **Public road/weather cameras** — only public-authority feeds we already allow, labelled "scene only".
   - **News event clusters** — GDELT, labelled "News, not official", like the current headline pins.
   - Existing layers stay: travel advice, unrest, flights, migration, news.

4. **Country drawer**
   Clicking a country slides in a panel: UK and US travel advice with dates, GDP per person / inflation / population from World Bank (with year), and the matching news video feed.

5. **Search** — type a country or city name and jump to it.

## Not included (and why)
- **Ships (AIS):** no free worldwide ship feed; the reliable ones are paid. Can add later if you want to pay for one.
- **Windy webcams:** needs a commercial agreement; we stick to public-authority cameras.
- **Military strikes:** no official live feed exists; stays out.
- **Switching to Cesium/Mapbox with 3D terrain:** heavy to load on phones and Mapbox costs money at volume. I'll upgrade the current globe engine instead, which keeps loading fast.

## Build order
1. Look and camera (day/night, atmosphere, presets, control-room panels, clocks, pointer readout).
2. Layer panel with counts + earthquakes + satellites.
3. Country drawer + search.
4. Fires (after you add the NASA key) and GDELT clusters.
5. Check on phone and desktop sizes; check the broadcast page still fits 1920×1080.

## Technical notes
- Keep react-globe.gl/three; add day/night shader material (sun position from UTC), atmosphere, points instancing (pointsMerge / custom layer) for thousands of markers.
- New pure parsers + tests: src/lib/quakes.ts, satellites.ts (satellite.js SGP4 from CelesTrak TLEs), fires.ts, gdelt.ts; server fetchers in *.server.ts, POST server fns, payload_cache keys quakes-v1 (5min), sats-tle-v1 (12h), fires-v1 (3h), gdelt-v1 (15min); serve lastGood while refreshing.
- Polling via TanStack Query refetchInterval, no websockets (edge runtime).
- Country drawer reuses world-bank-v2 cache and unrest-v1 advice; search uses unrest-places gazetteer.
- Every new layer listed in GlobeKey with source + age; AGENTS.md rule added for the new layers.
