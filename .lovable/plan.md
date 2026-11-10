# Orbit draft: globe effects and tile animations closer to the reference

Draft only, at `/globe/broadcast?layout=orbit`. The old live stream and ukstats.co.uk stay unchanged. Nothing gets published.

## Globe (to match your two reference images)
- Brighter, warmer city lights with a soft bloom glow, especially over Europe and the UK.
- A thicker, brighter blue rim of atmosphere hugging the edge of the globe, fading into space.
- Wider sweeping orbit arcs that cross in front of and behind the globe, with longer red light streaks travelling along them and glowing heads.
- Faint lens flare and light rays behind the globe's edge, plus slow drifting space dust.
- A smooth, slower turn to each country being reported, with a soft pulse ring on that country.

## Tiles and panels
- Each tile slides and fades in one after another when a segment changes, rather than all appearing at once.
- A light sweep across each card every few seconds, plus a thin animated red accent line along the top edge.
- Small bar charts grow in from zero to their real height. Numbers are shown exactly as published and never count through made-up in-between values.
- NEXT UP rail: the current item glows and the next one slides up when the segment changes.
- The ticker and lower third get smoother entrance animations.

## Checks before showing you
- Fresh 1920x1080 stills of the UK and World segments, saved to Files next to your reference so you can compare them.
- Check for overlaps, clipped text and blank tiles.
- Targeted stream tests and a clean build.

## Technical details
- Edit `OrbitGlobe.tsx` (shaders for rim and lights, an additive glow sprite, wider ring geometry, a particle field, and a focus pulse), `OrbitScene.tsx`, `OrbitStatsRail.tsx` and the scoped orbit styles in `styles.css` (keyframes for staggered entrance, shine and bar growth, all respecting reduced motion).
- No changes to the shared `EarthGlobe` or `GlobeExplorer`, or to the classic layout.
- Add the task to `roadmap.md`.
