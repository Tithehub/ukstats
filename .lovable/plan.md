# Bigger heads for every Aim High, Vote Lowe character

## What you'll get
- Rupert Lowe (hero), Andy Burnham (boss and running pose), Farage, Badenoch, Mahmood, Rayner and Sadiq Khan all redrawn in a "big-head cartoon" style: heads roughly 1.5x larger compared with their bodies, so faces are easy to recognise while playing.
- Everything else stays the same: suits, Union Jack cape, glasses, colours, poses, transparent backgrounds.
- Their size on screen and how they bump into things stay the same, so the game plays exactly as before.
- I'll show you a screenshot of the game with the new characters before you publish.

## Technical details
- Edit each sprite in src/assets/games/dash/ (lowe-hero, burnham-boss, burnham-run, farage, badenoch, mahmood, rayner, khan) with imagegen edit_image, transparent background, saving over the same files so no code changes are needed.
- Check each result for leftover background/halo; then Playwright gameplay screenshot at desktop size.
