# Aim High, Vote Lowe: live stats strip + theme tune

## Live stats (never on top of the game)
- A slim, slowly scrolling strip **above the game window** shows the latest published figures. It sits outside the play area, so it never covers anything you need to see or tap:
  - Small boats: the latest day and the total so far this year (Home Office)
  - Irregular arrivals (Home Office)
  - UK national debt (ONS)
  - Foreign aid spend (FCDO/ONS)
  - Income tax vs welfare: the two figures shown side by side, never merged
- Each figure shows its period and source as a short label, and tapping the strip opens the full figure on the site. If a figure isn't published, it says "Not published"; nothing is estimated.
- **Full screen on phones:** the strip is hidden, so the game keeps the whole screen. **Full screen on computers:** it sits as a thin bar along the top edge, above the game, never over it.
- The figures come from the site's stored copy, so the game doesn't load any slower.

## Theme tune
- An original, upbeat, retro arcade-style tune written for the game and played in the browser. It isn't copied from any song, so there are no copyright problems.
- A **Music on/off** button sits next to the Full screen button and works in full screen too. Your choice is remembered on that device.
- Music starts only once you press play, because browsers block sound that starts on its own. It pauses on the score screen and when you leave the tab.

## Unchanged
- How the game plays, scoring, leaderboards, sign-in and full screen.

## Technical details
- New `LiveStatsStrip` reads the existing UK stats query (stored `uk-stats` payload) and picks metric ids: `uk-small-boats-daily`, `uk-irregular-migration`, `uk-national-debt`, `uk-foreign-aid`, plus the `taxWelfareQuery` pair. It reuses the `games-ribbon-track` marquee and respects reduced motion. It's rendered outside the canvas container and hidden under `.game-fullscreen` on touch devices.
- New `src/lib/game-music.ts` for a Web Audio step sequencer with a short melody and bass loop, plus start, stop and dispose. The on/off choice is saved in `localStorage` under "lowe-music" and read after the page loads.
- A small test covers the metric selection: only the five chosen figures, and missing ones show "Not published".
