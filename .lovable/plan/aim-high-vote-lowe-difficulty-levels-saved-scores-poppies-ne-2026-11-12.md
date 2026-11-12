# Aim High, Vote Lowe: difficulty levels, saved scores, poppies, new flags, power punch

## What you'll get

**Three difficulty levels** picked on the start screen: Easy, Normal and Hard.
- Easy: slower speed, wider gaps between scandals, Burnham takes 2 hits and throws less red tape.
- Normal: the game as it is now.
- Hard: faster, narrower gaps, more rivals, Burnham takes 4 hits and throws red tape quicker.
Your best score on this device is kept separately for each level.

**Saved scores and a separate leaderboard.** Signed-in players' finished runs are saved under their nickname, on an "Aim High, Vote Lowe" board with Easy / Normal / Hard tabs and Today / This week / All time filters. The board is shown on the game page and as its own tab on the Games page. It stays **out of the Overall leaderboard**, and is labelled "Arcade scores — not checked like quiz scores". The quiz games can re-check every answer; a reflex game can't, so someone could fake a score. To keep the board sensible, scores above what is physically possible for that level are rejected, and each player can save at most 20 runs a day. Guests can still play; they're asked to sign in to save.

**Poppies as well as votes.** Red poppies float alongside the ballot papers and are worth extra points (e.g. 25 instead of 10), with their own counter in the top bar. They're drawn in the plain poppy style from your photo, but without the "Poppy Appeal" centre text — that wording is the Royal British Legion's trademark.

**New flags and banners.** The background flags change to the proper Restore Britain look from your logo: a navy UK map with "RESTORE BRITAIN" in the heavy serif lettering. The hanging banners between the poles read **"AIM HIGH, VOTE LOWE"** on alternating flags. Flags stay navy and white.

**Double tap for power punch.** Double-tap (or press Space twice quickly) and Rupert does a short forward dash with his fist out and a "POW!" burst. During the punch he smashes straight through one scandal column, knocks rivals off screen for double points, and counts as a hit on Burnham even when he isn't lunging. There's a short recharge (about 3 seconds) shown as a small fist meter, so you can't spam it. A single tap still makes him fly up as before.

## Technical details
- `src/lib/lowes-mission.ts`: `Difficulty` config (speed, gap, rival rate, BOSS_HP, tape cooldown); `newGame(seed, difficulty)`; poppy tokens (`poppies` count, score +25 each); `punch` state (active ~0.35s, cooldown 3s) triggered by `step(s, dt, flap, punch)`; punch breaks the first overlapping column, doubles smash bonus, lands a boss hit regardless of lunge; a `maxPlausibleScore(difficulty, seconds)` helper. Tests for each rule.
- Component: difficulty picker, double-tap detection (two taps within 280 ms → punch, first tap still flies), poppy sprite drawn on canvas, new flag drawing (UK outline + serif lettering, from the uploaded logo as a CDN asset), "AIM HIGH, VOTE LOWE" banners, fist meter, device best per level (`lowes-mission-best-<level>`).
- Database: new `arcade_scores` table (user id, game, difficulty, score, run seconds, London day); RLS — players insert their own rows only through a POST server function that checks the plausibility cap and daily limit; public read of nickname + score via a leaderboard function. Not part of `game_scores` or Overall.
- AGENTS.md rule updated: arcade scores are a separate, labelled, capped board, never in Overall.
