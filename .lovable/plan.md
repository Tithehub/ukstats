# AI Horse Racing Predictor

A new page, **AI Predictor** (/racing/predictor), linked from the racing dashboard, the racing tabs and every race on the racecards.

## What visitors see
1. **Race picker:** a Today / Tomorrow switch, then course cards (real Racing API meetings) with each race and its time. A "Next off" race is highlighted.
2. **Prediction panel** for the chosen race:
   - **Top pick card:** horse name, silks patch, number and draw, and a confidence meter labelled Low / Medium / High, never a percentage that looks like odds.
   - **Full field ranking:** every runner in AI order, with a bar showing its relative AI score. Non-runners are greyed out and excluded.
   - **"Why" chips per horse**, taken only from the racecard: recent form figures, official rating vs field, weight carried, draw, headgear change, jockey and trainer named.
   - **AI reasoning:** 2–3 plain sentences that only mention facts shown on the card.
   - **Your pick:** tap a horse to save "My pick" next to the AI's (stored on your device for now). This is the preview of the future AI-vs-human competition.
3. **After the race:** shows "Result not available on the current data plan" until results are connected, never a guessed result.
4. **Labels everywhere:** "AI opinion for entertainment — not a statistic, not betting advice", the 18+ notice with GambleAware/GamCare links, the generation time, and "Racecard supplied by The Racing API". No odds, no prices, no betting links.

Look: matches the existing racing green, gold and cream style, with the gallops photo header and a gold glow on the top pick. Works on phones (stacked cards) and desktop (picker left, panel right).

## Rules kept
- Predictions are opinions, kept separate from figures, and never shown in reports, the stream, embeds or the register.
- Races with too few facts (missing ratings or form for most runners) say "Not enough racecard information to predict", rather than a guess.
- No accuracy or "win rate" claims until real results exist to score against.

## Technical details
- `src/lib/racing/predictor.ts` (pure): a deterministic score from form, rating, weight and draw, giving a ranking plus "why" chips. Unit-tested: non-runners excluded, ties preserved, and the insufficient-data rule.
- `predictor.functions.ts`: a POST server function that takes a raceId, rebuilds it from the cached racecards, and sends only those card facts to Lovable AI (google/gemini-3-flash-preview) for the short reasoning text. The ranking comes from the pure scorer, never the model. Output is cached per race and racecard version in payload_cache ("racing-predict-v1:<raceId>").
- If AI fails, the ranking still shows with "Reasoning unavailable".
- Route `racing.predictor.tsx` uses search params `?day=&race=`, so picks are shareable, with its own head() metadata. Add a nav link in RacingLayout, a link on the dashboard (replacing the "arrive once a licensed feed" line) and a "Predict" link per race.
- AGENTS.md rule: racing AI predictions are labelled opinion, ranked by a pure scorer over card facts only, and excluded from reports, stream and embeds.
