# Stats strip inside the game window

## What changes
- The live stats ticker (small boats, irregular arrivals, UK debt, foreign aid, income tax vs welfare) moves from above the game into the game window itself, as a thin, see-through band along the very bottom edge.
- It shows on every screen: normal page, desktop full screen and phone full screen (currently hidden on phones in full screen).
- Not in the way of play:
  - Thin (about 18px), faint and semi-transparent, so riot barricades and characters show through it.
  - Taps and clicks pass straight through it to the game, so it never blocks a flap or power punch.
  - The game's own score bar stays at the top; nothing overlaps it.
  - While playing, figures are not clickable (so a tap can't open a page mid-run); on the start and score screens the figures become tappable links to their source on the site, as now.
- Each figure still shows its period and source; unpublished figures still say "Not published".

## Technical details
- LowesMission.tsx: remove the strip above the game and the separate full-screen strip row; render `<LiveStatsStrip compact overlay />` absolutely positioned at the bottom of the canvas wrapper (inside the rotated container so it rotates with pseudo-landscape), `pointer-events-none` during "play", enabled otherwise; z below the start/score overlay.
- LiveStatsStrip.tsx: add an `overlay` variant (transparent navy background, smaller type, reduced opacity).
- styles.css: drop the `--game-strip-h` canvas offset (canvas gets the full screen again) and the phone hide rule.
- Check at 1280 desktop, 390x844 and 844x390 phone full screen with screenshots.
