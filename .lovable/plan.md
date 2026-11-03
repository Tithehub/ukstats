# Live riot and protest markers on the globe

Add animated 3D markers to the globe wherever an official government source has recorded riots or protests. Each marker shows the official time it was published and links to that government's own advice and its official news and broadcast channels.

## What counts as "officially recorded"

- **Official markers (red riot / amber protest):** placed only when a UK Foreign Office or US State Department update, or another government source we've verified, mentions riots, protests, demonstrations or curfews in its own words within the last 30 days. If the advice names a city (for example "demonstrations in Paris"), the marker sits on that city. If no city is named, it sits on the capital and is labelled "country-wide advice — location not specified".
- **Research markers (ACLED):** individual events with dates and places. These stay clearly labelled "independent research, not official" and only appear once the ACLED login is supplied.
- No marker is ever placed because of news reports alone. News and broadcast links appear beside official records, never instead of them.

## What visitors will see

1. **Animated 3D icons on the globe**
   - Riot: a small low-poly flame on a pulsing red ring.
   - Protest: a raised placard with a softer amber pulse.
   - Research (ACLED) events: smaller, dimmer versions of the same icons so they read as secondary.
   - Icons scale with zoom, gently bob and pulse, and stop animating for visitors who have reduced motion switched on in their phone or computer settings.

2. **Click a marker → its warning card**
   - The government's exact words, quoted.
   - The official publication time (for example "Updated 22 Oct 2026, 14:05 UK time") and its age (fresh / ageing / overdue).
   - "Read the official advice" link.
   - "Official news and broadcasts" for that country: the police, interior ministry and government press channels and live streams we've verified (for example the French Interior Ministry and Préfecture de Police on X and YouTube, the Met Police, Poland's government press office).
   - "News coverage (not official)": BBC, Reuters and AP live pages, labelled separately.

3. **Live warnings strip**
   - A ticker above the globe (home page and /globe) listing the newest official riot and protest warnings first, each with its time. Clicking one flies the globe to its marker.
   - It refreshes every 15 minutes while the page is open and shows when it was last checked. If a source doesn't answer, it says so instead of guessing.

4. **Layer toggles**: "Riots", "Protests", "Research events", added to the existing controls and saved in the web address.

## Honest limits (will be shown on the page)
- Governments publish travel advice, not live riot feeds, so "real time" means as soon as their advice is updated. We check every 15 minutes, but the time shown is always the government's own publication time.
- Where the advice names no place, the marker shows the country, not the exact spot.

## Technical details
- `src/lib/unrest.ts`: add `classifyUnrest(text)` returning riot / protest / null from publisher wording, and `extractPlaces(text, gazetteer)` matching city names from a small checked list of major cities (lat/lng). Unit tests: "riots in Marseille" → riot at Marseille; "demonstrations may occur" → protest at capital, location unspecified; news-only text → no marker.
- `src/lib/unrest-places.data.ts`: capitals plus about 300 major cities with coordinates (from Natural Earth populated places, public domain).
- Keep exact published timestamps from the FCDO `public_updated_at` and State Dept `pubDate` (already parsed), shown with fmtDate plus time in Europe/London.
- Shorten the cache from 1 hour to 15 minutes for "unrest-v1", still serving the last good copy; client `refetchInterval` set to 15 minutes.
- `src/lib/live-sources.data.ts`: add a verified `broadcasts` list per country (official YouTube and X channels), with each link checked before it's added; any that can't be opened are left off.
- `EarthGlobe.tsx`: use react-globe.gl `objectsData` with three.js meshes (flame from cone and icosahedron with an emissive material, placard from box and cylinder) plus `ringsData` for the pulses. Animation runs in one shared `requestAnimationFrame` and respects `prefers-reduced-motion`. Keep it under about 200 meshes, with icons instanced per type.
- `GlobeExplorer.tsx`: ticker, marker selection state (`m` search param), and new layer toggles.
- Browser-check that markers render, a marker click opens the right card, and the ticker flies the globe to it; run tests.
