# Bigger, cleaner globe that works on every computer (including your Mac)

## What you'll see
- **Bigger globe on desktop.** On the homepage the globe takes up most of the screen height (about 80%, no longer capped at 620px). On /globe it fills the whole window below the top bar. The country panel on the right gets a little slimmer so the globe has more room.
- **Cleaner look, nothing removed.** Every option and feature stays where it is today: all layers, cameras, tour, key, share, zoom, the data readout, flights, boats, migration, news screens, both tickers and the warnings. Only the look changes:
  - Toolbar buttons line up neatly in one glass bar, all the same size and spacing.
  - Both ticker strips stay, restyled so they read as one tidy header.
  - Softer glass panels, fewer heavy borders and one accent colour throughout. The Earth gets a gentle glow, and a darker starry background makes markers stand out.
- **Phones and tablets** keep today's layout and controls, with just the tidier styling.

## Fixing the globe not showing on your Mac
I can't see your Mac, so the fix covers the common reasons a Mac fails while other machines work:
1. **Old saved copy:** after a publish, your browser may keep an old copy of the globe. If loading fails, it now fetches a fresh copy once on its own instead of giving up.
2. **Graphics refused or lost:** your Mac's graphics may refuse the globe, for example in low-power mode, with graphics acceleration off in Chrome, or because of Safari settings. It now tries again with lighter settings before giving up.
3. **Blank globe with no error:** a few seconds after starting, it checks that the globe actually appeared. If not, it restarts in lighter mode.
4. **If it still can't start:** you get a short message saying why instead of an empty space, for example "Your browser has graphics acceleration turned off". The message comes with a **Try again** button and the country list.

Once this is built, please open the globe on your Mac and tell me what message you see, if any, and whether you use Safari or Chrome.

## Technical details
- `GlobeExplorer.tsx`: height classes (`compact` -> `h-[78vh] min-h-[480px]`; full page -> fill `100dvh` minus header), aside `lg:w-[340px]`; restyle tickers, toolbar, zoom and bottom controls in place (no controls removed, hidden behind toggles or renamed).
- `loadEarthGlobe`: one retry with a cache-busting re-import on chunk failure; record the failure reason.
- `EarthGlobe.tsx`: on context creation failure or `webglcontextlost`, rebuild with `antialias:false`, pixelRatio 1 and reduced clouds/atmosphere; post-start draw check after about 3s.
- `hasWebGL` returns a reason (none / disabled / software-only), shown in the fallback with a retry button.
- Visual tweaks use the existing night tokens in `src/styles.css`; no new data sources. Broadcast/OBS layout untouched.
- Playwright checks at desktop 1280/1920, tablet and phone, plus a forced-failure check of the fallback. Nothing published.
