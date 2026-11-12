# Games ribbon below the globe on the home page

## What you'll see
- A slim "Free games" strip directly under the homepage globe.
- A continuously scrolling row of all 10 games (Daily 5, Britain by the Numbers, Higher or Lower, Guess the Number, Rank the World, Guess the Flag, English History, World Knowledge & History, Aim High Vote Lowe) — each a small square thumbnail with its name; tap to open the game.
- Scrolling pauses when you hover or touch it, and stays still for visitors who've asked their device to reduce motion (they can swipe it instead).
- A "See all games & leaderboards" link at the end, plus "Free sign-up to play" label.
- Works on phone, tablet and desktop.

## Technical details
- New `src/components/home/GamesRibbon.tsx` using existing artwork in `src/assets/games/`; list duplicated for seamless CSS marquee (keyframes in styles.css, `prefers-reduced-motion` disables, pause on hover/focus).
- Inserted after the globe in `UkLanding.tsx`; uses design tokens only.
