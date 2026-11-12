# Aim High, Vote Lowe: true full screen on phones

Desktop full screen stays exactly as it is.

## What changes on phones
- **The game fills the whole screen.** If the phone is held upright, the game turns sideways and fills the screen edge to edge, so there are no big empty bands above and below it. If you turn the phone sideways, it fills the screen normally.
- **Nothing in the way.** While the game is full screen, the site's top menu, bottom bar, topic bar, cookie or share bars and any floating buttons are hidden. They come back when you exit.
- **The browser's own bars shrink away** where the phone allows it. Android Chrome uses true full screen. On iPhone, Safari doesn't let websites hide its address bar completely, so the game covers everything else and sizes itself to the space that's left.
- **The Exit button gets smaller and see-through** and sits in the corner, so it doesn't cover the game.
- The start and game-over panels fit the sideways screen. Tapping anywhere still makes Rupert fly.

## Unchanged
- How the game plays, scores, leaderboard, levels, power punch and desktop full screen.

## Technical details
- In LowesMission.tsx, detect a touch or coarse-pointer device with a portrait window (`matchMedia`). When it's in full screen there, rotate a 100dvh×100dvw wrapper 90° and size the canvas with a "contain" fit to the rotated box. Remap pointer taps (any tap counts as a flap, so no coordinate maths is needed).
- Add a `game-fullscreen` class to `<html>` while full screen. A rule in styles.css hides the site header, footer, nav bars and toasters, and the game layer moves to the top z-index.
- Use `env(safe-area-inset-*)` padding for notches, use `100dvh` and `100dvw`, and listen for `resize` and `orientationchange`.
- Check with Playwright at phone size (390×844) in both portrait and landscape that the canvas covers at least 95% of the screen and the header isn't visible.
