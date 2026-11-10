# Let the presenter finish every stat, in step with the screen

## What's wrong
Each stat stays on screen for a time worked out in advance from its word count (about 2.6 words a second). Her real voice is slower than that, and figures like "£2.8tn" or dates take far longer to say than they look. So the screen moves on and cuts her off mid-stat.

## Fix
1. **She always finishes:** while she is still speaking, the screen holds on the stat she is reading. It moves on only once she has finished the line.
2. **Screen and voice stay together:** the screen always shows the stat she is reading, never one ahead. When she finishes, the screen moves to the stat she reads next.
3. **Back on the clock:** after a hold, the stream rejoins the London-clock running order. If a hold ran long, the next stat in that slot is skipped rather than rushed, so headlines, sponsor breaks and the half-past explainer still start on time.
4. **Better timing estimate:** stat lengths are worked out from how the line is actually spoken (numbers, £, %, dates counted as the words she says) at a slower newsreader pace, so holds are rare and fewer stats are skipped.
5. **Voice off / voice fails:** the screen just follows the clock as now, so the stream never freezes.

Unchanged: what she says, the running order, sponsors and explainers.

## Checks
- New automatic checks: a stat is never replaced while she's speaking; after a hold the stream rejoins the clock; spoken-length timing for figures like "£2.8tn" and dates.
- Existing stream checks.
- Watch a UK-hour slot in the preview with sound if a voice sign-in works; otherwise report it as unheard.

## Technical details
- `stream-script.ts`: `spokenWords(text)` (expands £/%/bn/tn/numbers/dates via `speakable`) and `lineMs` at ~2.2 words/s + 1.2s pause.
- `BroadcastView.tsx`: hold state — while `OrbitPresenter`/`Presenter` report speaking (`onSpeak` start + new `onDone`), keep the displayed line index; on done, jump to `lineAt(now)` and skip any line whose remaining time is under half its length. Hold is capped at 25s per line so a stuck clip can't stall the stream.
- Presenters: emit `onDone` when a clip ends/errors/watchdog; screen line changes no longer cut a playing clip unless the slot itself has changed.
