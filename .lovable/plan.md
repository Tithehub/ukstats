# Globe "news programme" mode — UK first, auto-advancing countries

## What visitors will see
- **Broadcast mode (on by default):** the globe opens on the UK and shows a timed "bulletin" for it, with a progress bar and countdown like the sponsor banner. When the bulletin ends, the globe flies to the next country and starts that one's bulletin.
- **Each bulletin plays in segments**, about 8 seconds each:
  1. Main figures (the key World Bank figures plus source and year; the UK uses register figures)
  2. Official warnings (the government's exact words and publication time, or "No current official warning")
  3. Latest news (the newest videos from verified channels, labelled Official / MSM / Alternative, "not official" where it applies)
  Empty segments are skipped, so there are no blank screens.
- **Running order:** UK first, then countries with fresh official warnings (newest first), then the rest of the globe's countries in a fixed order. It loops.
- **Choosing a country:** clicking or searching for a country shows its full bulletin at once. When that bulletin finishes, the programme carries on to the next country in the list.
- **Controls:** Pause/Play, Previous/Next country, Previous/Next segment, and a "Stop broadcast" switch. Clicking anywhere in the panel pauses it, so people can read.
- **Breaking ticker:** a slim strip along the bottom of the globe scrolls the newest official warnings and video headlines. It refreshes by itself: warnings every 15 minutes, videos every 5.
- **Play in the same window:** a "Watch" button on a news item plays it inside the panel in the privacy-enhanced YouTube player. The bulletin pauses while a video plays.
- **Spin is 3× faster**, from 0.25 to 0.75.
- **Share buttons:** a small share icon in the top bar opens a compact menu (X, Bluesky, Facebook, WhatsApp, copy link) that shares the current country view. It stays closed until tapped, so it never covers the globe.

## Rules kept
- No figures are created; every figure shows its source and year, as now.
- News never creates warnings or changes any figure. Titles stay word for word.
- People with reduced-motion settings get no auto-advance. Broadcast starts paused and moves on only when tapped.

## Foundation: the globe as the main hub (second step, same build)
- Every country's buttons (stats, world profile, compare, crime, gold, preparedness) stay in the panel as the jump-off point for the whole site.
- The top menu "Globe" item and the home page globe stay first. Existing pages remain usable below and through the menu.

## Technical details
- New pure module `src/lib/globe-broadcast.ts`: `buildRunningOrder(countries, warnings)` and `buildSegments(country, stats, warnings, videos)`, with tests: UK first, warnings ordered by recency, empty segments skipped, and a chosen country resumes the list after it.
- New `src/components/globe/BroadcastPanel.tsx` (timer with requestAnimationFrame progress, pause on hover/focus/video) and `BreakingTicker.tsx`; `GlobeShare.tsx` reuses ShareRow logic (clipboard success only after write resolves).
- Search params: `bc` (on/off), `seg`; existing `c` drives the current country.
- `EarthGlobe.tsx`: autoRotateSpeed 0.25 to 0.75. Auto-rotate pauses during fly-to.
- Reuses existing unrest and video-feed queries; no new data sources. Videos still depend on the YouTube feed or key working.
