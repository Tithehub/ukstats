# Rupert Lowe becomes the hero of the London-to-Manchester game

## What changes for players
- **New hero:** a cartoon Rupert Lowe, drawn from your photo (grey swept-back hair, navy suit, red tie), wearing a Union Jack cape like Superman. He flies the same route, from 10 Downing Street to Manchester.
- **Votes instead of coins:** the gold coins become ballot-paper "VOTE" tokens, and the score counts votes.
- **Smash the MPs:** cartoon Nigel Farage and Kemi Badenoch now fly in as targets. Flying into one smashes them: they spin off screen with a "SMASH!" burst, and you get bonus votes. They no longer end your run.
- **Boss: Prime Minister Andy Burnham.** He turns up as a boss at three points on the route (Watford, Birmingham and finally Manchester). He hovers on the right with a health bar and throws red-tape bundles that you have to dodge. Ram him three times to beat him for a big vote bonus. If he's still standing at Manchester, the final fight decides whether you win.
- **Unchanged:** scandal columns and riot barricades still end your run, and the London, Midlands and Manchester backgrounds stay the same.
- **New name:** "Lowe's Mission" (open to a different name if you prefer). The old link still works and forwards to the new page. The Games hub card gets new artwork showing Lowe in his cape.
- **Parody label:** the parody notice stays, and best scores are still saved only on the player's device and kept off the leaderboards.

## Artwork to make
- Rupert Lowe flying with a Union Jack cape, based on the photo you uploaded.
- An Andy Burnham boss version: the current jet-black-hair, glasses version, bigger, arms folded and scowling.
- A "smashed" pose for Farage and Badenoch (it can reuse their current pictures with a spin effect).
- A vote token, plus new artwork for the hub card.

## Technical details
- `src/lib/burnhams-dash.ts` becomes `src/lib/lowes-mission.ts`. Touching a rival now smashes it instead of ending the run. A boss state is added (health 3, red-tape projectiles, triggered at set stages of the journey). The tests are updated for smashing, the boss taking three hits and the win condition.
- New route `/games/lowes-mission`. `/games/burnhams-dash` redirects to it. The hub, sitemap and AGENTS.md rule are updated, and the device-only best score keeps its old value.
- Old sprite files that are no longer used are removed. The Burnham artwork is reused for the boss.
