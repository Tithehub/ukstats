# Add weather to the live globe

## What you'll see
A new **Weather** switch in the globe's Layers menu, with three parts you can tick separately:
1. **Weather now** — about 250 dots on major cities worldwide showing temperature, a weather icon (sun, cloud, rain, snow, storm) and wind. Hover for details; click for a small card with the reading time and source.
2. **Clouds and rain from space** — an optional see-through overlay of the latest worldwide satellite cloud / rain radar picture, with its time stamp.
3. **Official weather warnings** — UK Met Office warnings (already used on the site) shown as coloured yellow/amber/red areas over the UK, labelled with the Met Office's own wording and link.

Each part shows its source, the time of the reading, and "Not published" if a source doesn't answer — no guessed or filled-in values. Works on the home page globe and the full globe page, on phones too.

## Sources
- City readings: Open-Meteo (free, no key, built from national weather services' models) — labelled "model reading, not an official observation".
- Cloud/rain picture: RainViewer public tiles (free, no key), labelled with its time.
- Warnings: Met Office feed already in the site.

## Technical details
- `src/lib/weather-globe.ts` (pure parser + city list, tested) and `weather-globe.functions.ts` (POST server fn, payload_cache "weather-globe-v1", 30 min TTL, one batched Open-Meteo request).
- New `wx` search param + Layers toggle in GlobeExplorer; markers passed to EarthGlobe like quakes; cloud overlay as a semi-transparent globe texture layer.
- Legend entry in globe-legend.ts; note in src/lib/AGENTS.md.
