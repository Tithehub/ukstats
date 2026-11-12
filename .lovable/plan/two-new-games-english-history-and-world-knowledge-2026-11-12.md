# Two new games: English History and World Knowledge

## The games
1. **English History** (`/games/english-history`): 10 multiple-choice questions per round, four options each. Topics include monarchs, battles, Magna Carta, Parliament, the Civil War, the Industrial Revolution and the world wars.
2. **World Knowledge & History** (`/games/world-knowledge`): 10 multiple-choice questions on capitals, geography, major world events, inventions and famous treaties.

Both work like the other games. You get 100 points per correct answer. After each answer you see the correct choice and a one-line explanation, with a link to a trusted reference. Each game has its own leaderboard, and both count towards Overall. Signed-in players keep their best round each day.

## Keeping it factual
- The questions are a fixed list I write once (about 120 per game), not made up by AI while you play. That means no running costs and the same answers every time.
- Every question gives its source: UK Parliament, the National Archives, the Royal Collection, the Royal Mint, Britannica or the UN.
- I leave out questions where historians disagree, along with anything political or modern-day contested.
- Each round is a seeded shuffle of the list, and the server re-checks scores just as it does for the other games.

## Where they appear
- Two new cards on the Games page with new artwork in the same navy and gold style.
- Added to the leaderboard game picker, the Overall total and the sitemap.

## Technical details
- `src/lib/quiz.data.ts`: a typed bank `{ id, game, q, options[4], answer, explain, src: {name,url} }`.
- `games.ts`: new `"quiz"` question kind, a `quizRound(game, seed)` function, and GAME_DEFS entries. Scoring uses the choice index.
- `QuestionCard`: shows quiz questions with the shared four-button layout.
- `games.functions.ts` re-scoring branch. The SQL overall leaderboard picks up the new game ids. Add a migration only if the game list is hard-coded there.
- Tests: every bank entry has four unique options, a valid answer index and an https source. Rounds use the same seed to give the same questions with no repeats.
