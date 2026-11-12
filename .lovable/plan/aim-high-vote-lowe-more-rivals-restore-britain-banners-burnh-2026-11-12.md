# "Aim High, Vote Lowe": more rivals, Restore Britain banners, Burnham runs away

## What changes for players
- **New name:** the game becomes **"Aim High, Vote Lowe"** on the Games page, the page title and share text. The current link keeps working, and a new matching link is added (old links forward to it).
- **Three new targets:** cartoon Shabana Mahmood, Angela Rayner and Sadiq Khan (labelled "Mayor of London") join Farage and Badenoch. Each is drawn as a caricature from the photos you uploaded.
- **Blast off:** smashing any of them now launches them off the screen. They spin up and away with a "SMASH!" burst and a trail of smoke.
- **Burnham runs away:** every time Rupert rams Burnham, the boss shows a running-away pose. He sprints back across the screen, looking over his shoulder, then returns for the next hit. On the third hit he runs off for good.
- **Restore Britain in the background:** "RESTORE BRITAIN" flags flying on poles and hanging banners appear along the route, scrolling slower than the obstacles so they don't get in the way. They're drawn in the navy-and-white palette.
- **Caped hero:** I'll try the Rupert Lowe drawing with the Union Jack cape again, so the hero you control in the game wears it.
- **Unchanged:** you control Rupert, you collect votes, scandals and riots still end the run, and the backgrounds, parody label and device-only best score stay as they are.

## Artwork to make
- Cartoon sprites of Mahmood, Rayner and Khan, flying toward the left, based on your photos.
- Burnham in a running-away pose, alongside his current boss pose.
- Rupert Lowe in a Union Jack cape, redone.
- A new Games-page card with the "Aim High, Vote Lowe" theme.

## Technical details
- In `lowes-mission.ts`, rivals become farage, badenoch, mahmood, rayner and khan. The boss gets a "fleeing" timer after each hit: he runs right and off screen, then re-enters. Smashed rivals get a stronger upward and outward launch. The tests are updated for the new rivals and for fleeing after a hit.
- The new route is `/games/aim-high-vote-lowe`. `/games/lowes-mission` and `/games/burnhams-dash` both redirect there. The hub, sitemap and AGENTS.md rule are updated.
- The flags and banners are a parallax layer drawn on the canvas between the backdrop and the obstacles.
