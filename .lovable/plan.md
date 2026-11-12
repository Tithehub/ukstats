# Aim High, Vote Lowe thumbnail with UK Stats logo

Use the game's current artwork as the card thumbnail and place the official UK Stats logo on it.

## What changes
- The Aim High, Vote Lowe card on the Games page keeps its current game artwork.
- The official UK Stats logo (the same one on the Press page) is added in a corner on a small navy panel, so it's easy to read on the busy picture.
- The same picture with the logo is used as the share preview when someone shares the game link.
- Nothing else on the Games page changes.

## Technical details
- Composite `public/press/ukstats-logo.png` onto `src/assets/games/aim-high-vote-lowe.jpg` with Pillow (top-left, ~22% width, navy #051D3F rounded backing, padding), saving the result over the same file so the hub import stays the same. Real logo pixels are reused, not redrawn.
- Copy to `public/og/aim-high-vote-lowe.jpg` and add og:image / twitter:image using the absolute `https://ukstats.co.uk/og/...` URL in the game route head.
- Check the result at card size before finishing.
