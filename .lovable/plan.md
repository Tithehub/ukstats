# Fix game share pictures and swap in the new UK Stats logo

## Why the picture isn't showing on X
The share picture was only added in the preview. X and the other sites read the live site, which only gets the picture after you publish. The other game pages have no share picture set at all, so they show nothing either.

## What changes
- **New logo badge:** the Aim High, Vote Lowe picture goes back to its original artwork, then gets your new navy UK Stats logo on a thin white strip in the top-left corner, the same placement as before but slimmer.
- **Share pictures for every game:** each game (Daily 5, Higher or Lower, Guess the Number, Rank the World, Britain by the Numbers, Guess the Flag, English History, World Knowledge, Aim High, Vote Lowe) and the Games page get their own share picture, made from their game artwork with the same thin logo badge, sized for X, Facebook, WhatsApp and the others.
- The game cards on the Games page also show the badge, so the cards and the share previews match.

## After building
You'll need to publish. X may still show an old preview for a while; it updates when X checks the link again.

## Technical details
- Restore original art from /tmp/thumb/orig.jpg (fall back to git history); crop the uploaded logo to its content and place it at about 20% width on a white rounded strip with small padding.
- Write 1200x630 JPGs (under 300 KB) to public/og/games-<slug>.jpg; add absolute https://ukstats.co.uk og:image and twitter:image to each game route head (games.$game.tsx per game, games.index.tsx, aim-high route).
- Check each picture at card size and the head tags in the rendered page.
