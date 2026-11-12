# Flag game on the leaderboard + an Overall leaderboard

## What you'll see
- The leaderboard on the Games page gets a game picker with **Overall** first, then every game, including **Guess the Flag**. Guess the Flag is already in the picker, so this step just checks it shows up.
- The Games page leaderboard opens on **Overall** by default. Each game's own page still opens on its own board.
- **Overall** adds up each player's points from all six games (Daily 5, Britain by the Numbers, Higher or Lower, Guess the Number, Rank the World, Guess the Flag). It works with the existing Today / This week / All time buttons.
- Overall columns: Player, Games played, Best single round, Total points.
- Only one score per game per day counts, the same as now: the Daily 5 entry, or the day's best round in the practice games. So replaying can't inflate the Overall total.
- The Overall board shows a note: "Overall = total points across all games. Each game counts once per day (your best round)."

## Technical details
- Update the database function `game_leaderboard`: when `_game = 'overall'`, include every game instead of filtering by one. It stays read-only and public as before, and still shows nickname or "Player xxxx" only.
- `getLeaderboard` already passes the game through. The Leaderboard component adds `"overall"` as a picker option (default when `choose` is on). The "Played/Days" column label becomes "Games" for Overall.
- Add a small test that the picker list contains overall plus all six games.
