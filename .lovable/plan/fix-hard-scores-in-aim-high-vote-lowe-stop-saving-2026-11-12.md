# Fix: Hard scores in Aim High, Vote Lowe stop saving

## What's going wrong
Each player can save only 20 runs a day, and every run counts, including low ones. Today one player saved 20 Hard runs, the best scoring 692. After the 20th run, every later run was turned away, however high it scored. The same thing has happened to two other players today, on Easy and on Normal. The score limit isn't the problem: 692 is well within it.

## The fix
- Keep **one best score per player, per level, per day**, the same way the quiz games keep your best practice score.
- A run that beats your best for today replaces it straight away. A lower run isn't saved, so it can't use up anything. The 20-a-day cap is removed.
- After each run the game says plainly either "New best saved: 912" or "Your best today is still 692".
- Today's existing runs are tidied down to each player's best one per level, so the leaderboard and admin totals stay correct.

## Technical details
- Migration: delete the non-best rows per (user_id, difficulty, day), then add a unique index on (user_id, game, difficulty, day).
- arcade.functions.ts: keep the plausibility cap. Read the existing row and update it only when the new score is higher, otherwise insert. Drop ARCADE_DAILY_LIMIT and return `{ ok, best, improved }`.
- LowesMission.tsx: show the improved / still-best message.
- Test: a pure `shouldReplace(existing, next)` helper. Higher replaces, equal or lower does not.
- Update the arcade rule in project knowledge: best per level per London day, instead of a daily run limit.
