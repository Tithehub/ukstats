# Add "Burnham's Dash" — a flappy-style arcade game

## What players get
- New game at `/games/burnhams-dash`, listed on the Games hub with its own artwork card.
- Player is a cartoon caricature of Andy Burnham (in a red rosette/suit), tapping or pressing space to fly.
- Route: starts outside 10 Downing Street and scrolls north to Manchester. A progress bar shows the journey (London → Watford → Milton Keynes → Birmingham → Stoke → Manchester), with the backdrop changing as you pass each stage.
- London stretch backdrops: Big Ben and Parliament, Westminster Abbey, Tower Bridge, St Paul's — layered for depth. Later stretches switch to Midlands scenery, then Manchester landmarks (Town Hall, the canals).
- Collect gold coins for points.
- Avoid "scandal" obstacles: pipe-style columns made of red-tape and newspaper stacks with joke headlines.
- Jump over "riot" barriers along the ground: police tape, cones, toppled bins. No real people or real events are shown.
- Rival MPs he is dodging: cartoon Nigel Farage, Rupert Lowe and Kemi Badenoch fly across now and then. Touching one ends the run.
- Game over screen shows coins, distance and how far toward Manchester you got, with Share and Play again buttons.
- Clear label: "Parody game. Characters are cartoon caricatures, not endorsed by anyone shown." No statistics are shown, so the no-made-up-figures rule is unaffected.

## Scoring and leaderboard
- Best score is saved on the player's own device and on their profile when signed in.
- It is **not** added to the Overall leaderboard. A reflex game's score cannot be checked by the server the way quiz answers are, so letting it in would make the Overall board easy to cheat. A separate "Burnham's Dash best runs" board marked "unverified" can come later if you want it.

## Artwork
- Generate original cartoon sprites (Burnham, three rivals, coin, obstacles) and layered landmark backdrops in the site's navy, gold and red style. Caricatures only, no photos.
- New hub card image to match the other game cards.

## Technical details
- Canvas 2D game loop in a client-only component (`src/components/games/BurnhamsDash.tsx`), with physics and collisions in a pure module `src/lib/burnhams-dash.ts` covered by tests (gravity, collision, stage progression by distance).
- Route file `src/routes/games.burnhams-dash.tsx` with its own head() metadata; add to the games hub list, sitemap and profile game list.
- Keyboard (space/up), click and touch controls; pauses when the tab is hidden; respects reduced-motion by slowing parallax.
- Best score stored in localStorage (read after hydration) and, for signed-in players, a profile field; no change to game_scores or the Overall function.
