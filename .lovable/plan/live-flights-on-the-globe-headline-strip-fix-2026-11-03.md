# Live flights on the globe + headline strip fix

## 1. Fix: headline strip in light mode
The two strips on the globe (the "Official warnings" strip above it and the "Latest" strip below it) sit on a dark background, but their text takes the page's text colour. In light mode that colour is dark, so the text is dark on dark and hard to read. Both strips will use the globe's own light text colour and muted colour, so they read the same in light and dark mode. I'll check both modes on computer and phone sizes.

## 2. Live flights layer
- New **Flights** switch in the Layers panel, off by default so the globe stays fast for people who don't want it.
- **Data:** OpenSky Network's free public feed of aircraft positions (the planes broadcast these themselves). Refreshed about every 60 seconds, within the free limits. Labelled "Aircraft positions from OpenSky Network — not official government data." If OpenSky doesn't answer, the layer shows "Flight data unavailable" plus the last check time. Nothing is guessed.
- **All planes shown** (about 8,000–12,000), drawn as small plane icons turned in the direction they're flying, in one lightweight layer so the globe keeps turning smoothly. On phones, as a fallback, icons get smaller if the frame rate drops.
- **Flight paths:** clicking a plane shows its trail for the last few minutes and a short line ahead along its heading. The free feed doesn't include destinations, so the line ahead is shown as a direction, not a route.
- **Colours (both rules combined):**
  - **Red:** the plane is broadcasting an emergency code (7700 general emergency or 7500 hijack), OR it is over a country where the UK or US government advises against all travel / Level 4.
  - **Amber:** radio-failure code (7600), OR over a country with lower-level warnings (FCDO "against all but essential travel", State Dept Level 3).
  - **Green:** everything else.
  - The free feed has no destinations, so colours based on travel advice use the country the plane is flying over right now, not where it's going. The key will say this.
- **Plane card:** callsign, country of registration, altitude, speed, emergency code if any, which rule set the colour (in plain words), the time of the position and a link to the official travel advice that triggered it.
- **Bulletin and strip:** a plane broadcasting an emergency code appears in the "Latest" strip as "Aircraft emergency code 7700 — callsign, over country (time)". Clicking it turns the globe to that plane. It never creates an official warning marker.
- Shareable in the web address (flights on/off, selected plane).

## Rules kept
Flight colours never change any statistic or official warning. UK and US advice levels stay labelled separately on the plane card. No made-up routes or destinations.

## Technical details
- `src/lib/flights.ts` (pure): parse OpenSky `/states/all`, squawk → status, country-under-plane lookup using the existing world-atlas polygons, combine with `fcdoAlerts`/State Dept levels from `unrest-v1`. Tests: 7700 → red, 7600 → amber, Level 4 country → red, Level 3 → amber, emergency code overrides advice.
- `src/lib/flights.server.ts` + `flights.functions.ts` (POST): fetch with 60s TTL, store compact arrays in payload_cache "flights-v1", serve last good. Optional `OPENSKY_CLIENT_ID/SECRET` later for more requests per day (only if the free anonymous limit runs out).
- EarthGlobe: a single custom three.js `Points`/instanced mesh layer with heading rotation (not per-plane React objects); trail stored client-side from the previous few polls; reduced motion turns off interpolation.
- Search params `fl` (on/off) and `fp` (plane id). AGENTS.md rule for the flights source.
- Light-mode fix: add `text-night-fg` to both ticker containers in GlobeExplorer.tsx and `text-night-muted` where it's missing.
