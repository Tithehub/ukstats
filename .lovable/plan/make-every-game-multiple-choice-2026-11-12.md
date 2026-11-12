# Make every game multiple choice

Today Higher or Lower and Guess the Flag already use tap-to-answer choices. Two question types do not:
- **Guess the Number** — you type a number.
- **Rank the World** — you drag five countries into order.

Both also appear inside Daily 5 and Britain by the Numbers, so changing them makes all six games multiple choice.

## New question styles
- **Guess the Number → "Pick the right figure"**: "What is Japan's population?" with 4 answer buttons. One is Japan's real figure; the other three are the **real published figures of other countries** (or councils, for Britain) for the same measure — no invented numbers. 100 points for the right answer.
- **Rank the World → "Which is highest?"**: shows 4 countries (or councils) and asks which has the highest (or lowest, alternating) value. Tap one. 100 points if correct.
- After every answer, all four options reveal their real value, source and date, as now.

## Game names and descriptions
- "Guess the Number" keeps its name; description becomes "Pick the right figure from four".
- "Rank the World" keeps its name; description becomes "Spot the top country from four".
- Daily 5 and Britain by the Numbers rules text updated to say every question is multiple choice.

## Scores and leaderboards
- Every question is now worth 0 or 100, so all games score out of the same total per question.
- Scores already saved stay on the boards; new rounds use the new format from the next London day so nobody's Daily 5 changes mid-day.

## Technical details
- `src/lib/games.ts`: `guess` gets `choices: Fact[]` (answer + 3 distinct-value distractors from same pool, shuffled by the seed); `rank` becomes 4 items + `dir: "high"|"low"`, answer is a choice index. `scoreQuestion` / `questionText` updated; seeded so server re-scoring still matches.
- `QuestionCard.tsx`: replace number input and drag list with the shared 4-button choice UI used by flags.
- Server re-scoring functions unchanged in shape (answers become indexes); add a date cut-over so today's Daily 5 seed keeps old kinds.
- Update `games.test.ts` scoring tests: distractors are real values, one correct option, rank picks true max/min.
