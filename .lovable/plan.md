# Bigger, cleaner globe that works on every computer (including your Mac)

## What you'll see
- **Bigger globe on desktop.** On the homepage the globe gets most of the screen height (about 80% instead of capped at 620px), and on /globe it fills the whole window below the top bar. The country panel on the right gets slimmer so the globe has more room.
- **Simpler look, same features.** Every layer, camera, tour, key, flights, boats, migration, news screens and warnings stays. What changes:
  - One tidy toolbar at the top (search, Layers, Cameras, Key, Tour, Share) instead of several floating button groups; the bottom-left buttons and the zoom buttons move into it.
  - The two ticker strips above the globe merge into one line (official warnings first, then headlines).
  - The data readout (HUD) only appears when you open it, instead of always on.
  - Softer glass panels, fewer borders, one accent colour, a gentle glow round the Earth and a darker starry background so markers stand out.
- **Phones and tablets** keep today's layout, just with the merged ticker and tidier toolbar.

## Fixing the globe not showing on your Mac
I can't see your Mac, so the fix covers every reason a Mac commonly fails while other machines work:
1. **Stale saved copy:** if the globe's code fails to load (an old cached version after a publish), it now retries once with a fresh copy automatically instead of giving up.
2. **Graphics refused or lost:** if the Mac's graphics turn the globe down (low-power mode, hardware acceleration off in Chrome, Safari settings), it tries again with lighter settings (no smoothing, lower detail) before giving up.
3. **Blank globe with no error:** a check a few seconds after start confirms the globe actually drew; if not, it restarts in lighter mode.
4. **If it still can't start:** instead of a silent blank, you see a short message saying why (e.g. "Your browser has graphics acceleration turned off") with a **Try again** button and the country list, so the page is never empty.

After this is built, it would help if you open the globe on your Mac and tell me what message (if any) appears, and whether you use Safari or Chrome.

## Technical details
- `GlobeExplorer.tsx`: height classes (`compact` → `h-[78vh] min-h-[480px]`; full page → `h-[calc(100dvh-...)]`), aside `lg:w-[340px]`; merge ticker rows; consolidate toolbar + zoom + bottom controls; HUD behind a toggle.
- `loadEarthGlobe`: one retry with cache-busting re-import on chunk failure; record failure reason.
- `EarthGlobe.tsx`: on context creation failure or `webglcontextlost`, rebuild with `antialias:false`, pixelRatio 1, reduced clouds/atmosphere; post-start draw check (read renderer info/frame count after ~3s).
- `hasWebGL` returns a reason string (none / disabled / software-only) shown in the fallback with a retry button.
- Visual tweaks via existing night tokens in `src/styles.css`; no new data sources, no layer removed. Broadcast/OBS layout untouched.
- Check desktop 1280/1920, tablet and phone in Playwright, plus forced-failure tests for the fallback path. Nothing published.
