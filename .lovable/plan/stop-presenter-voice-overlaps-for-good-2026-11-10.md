# Stop presenter voice overlaps for good

You've confirmed the doubling comes from the one stream source in OBS, so the fix targets causes inside that page.

## What the audit found
1. **A new player for every line.** Each line creates its own audio player. The "one voice at a time" rule only stops players that have already registered, so a clip that is still loading can slip past it and start over the current one.
2. **She reads ahead on her own.** When a clip ends she starts the next line herself, while the screen can start that same line at the same moment. Two clips get prepared, and a slow one can still start late.
3. **Gaps in the stop checks.** Some sound set-up happens before she registers her voice, so a clip can start after the screen has moved on.

## What I'll change
- **Exactly one audio player for the whole page:** her voice always plays through one shared player. A new line replaces whatever is playing, so two clips can never sound at once.
- **No reading ahead:** she only ever says the line on screen. Clips that arrive late or out of order are thrown away.
- **Clean stops:** her voice stops when the page reloads, hides or changes slot.
- **Overlap alarm:** if a second clip ever tries to start, it is blocked and noted, so we'd know exactly when.

## Checks
- Automatic checks that change lines quickly and have clips arrive late and out of order; at most one clip may ever play.
- Run the stream in the preview with voice on, through a sponsor break and the :30 explainer, and confirm only one clip plays at any moment.
- Nothing published without your go-ahead.

## Technical notes
- voice-channel.ts becomes a single page-wide audio element with one AudioContext and analyser. `play(text, token)` swaps its source, so two clips can't run at once.
- Presenter.tsx and OrbitPresenter.tsx share one `useVoicePlayer` hook. Remove the `nextLine` read-ahead from `finish`, and check the token after every await.
- Stop on `pagehide` and `visibilitychange`.
