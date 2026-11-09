# Keep globe markers visible on a selected country

## Problem
When you pick a country, it lifts off the globe and fills with solid white. That raised white shape sits above most markers (cameras, weather, news pins, labels), so they disappear underneath it.

## Fix (globe only, preview only)
- Keep the selected country flat on the surface (same height as other countries) so every marker sits above it.
- Swap the solid white fill for a soft see-through white tint with a brighter white outline, so the selection is still obvious but markers show through and on top.
- Nothing else changes: marker colours, data, old live stream and Orbit stream untouched. Nothing published.

## Check
Open a country (e.g. United States) at your screen size with cameras, weather and news layers on, and screenshot to confirm markers are visible over the highlighted country.

## Technical details
- `src/components/globe/EarthGlobe.tsx`: `polygonAltitude` for selected 0.03 -> 0.009 (just above 0.008 to avoid z-fighting, below all markers at ≥0.004... cams raised to 0.012 so they clear it); `COLORS.sel` -> `rgba(242,246,255,0.28)`; `polygonStrokeColor` brighter for the selected country.
