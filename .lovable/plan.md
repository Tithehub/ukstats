# Globe opens with every layer switched on

## What you'll see
On the home page and the Globe page, the globe starts with all overlay layers already ticked: official unrest warnings, riots, protests, military, research (ACLED), flights, migration, news & police reports, earthquakes, satellites, weather, live cameras and day/night shading. You can still untick any layer, and that choice stays in the page link so shared links keep it. "Colour by" (one indicator or one government's advice scale at a time) stays as now, since only one can show.

## Technical details
- In `parseGlobeExtras` and the route `validateSearch` defaults (`src/routes/globe.tsx`, `src/routes/index.tsx`, `/$country` if it hosts the globe), treat a missing layer param as on; only an explicit `0`/`false` turns it off.
- Checkbox off writes `false` into the URL instead of removing the param.
- Broadcast/stream layout keeps its own fixed layer set (unchanged).
- Check desktop and phone that the globe still loads quickly with everything on (flights/satellites are the heaviest); nothing published.
