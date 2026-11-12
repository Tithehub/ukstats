# Aim High, Vote Lowe: parody nicknames + two new characters

## Name changes (shown in game, banners, crash messages, share text and game card)
- Rupert Lowe -> RUPERT AIM HIGH VOTE LOWE (hero)
- Angela Rayner -> ANGELA RAVER
- Shabana Mahmood -> BANANA MAHMOOD
- Andy Burnham -> ANDY BIRDMAN (boss)
- Sadiq Khan -> SADIQ CAN'T
- Kemi Badenoch -> KEMI HAD ENOUGH
- Nigel Farage -> removed from the game entirely (sprite, rival list, text)

## New characters
- **ZACK BOOBANSKI** (Zack Polanski): new rival who blasts off the screen when smashed, same as the others. New cartoon sprite in the same style, big head, green-party colours.
- **DAVID LAMMY AS MASTERMIND**: new final boss. After Birdman runs away for good in Manchester, Lammy appears as the mastermind behind it all for one last fight; smashing him wins the run. He does not throw anything until that very last fight (keeping your "only hard at the end" rule).

## Unchanged
- Page address, scores, leaderboard, difficulty levels, poppies, power punch, full screen.
- Game stays labelled as parody.

## Technical details
- Update RIVAL_NAMES and boss labels in src/lib/lowes-mission.ts and on-screen text in LowesMission.tsx, route head/share copy and games hub card.
- Remove "farage" rival; add "polanski" rival and a "lammy" final-boss phase to the pure engine; extend tests (Lammy only after third Birdman hit, no projectiles before final fight).
- Generate two sprites matching existing style, clean green-screen edges.
