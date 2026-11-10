# Stop the presenter's voice overlapping

## What's wrong
From 19:46 (just after the quarter-to sponsor break, in the second UK hour) two voice clips can play at once. The presenter's player only cancels an old clip if the screen changes at certain moments. If the screen moves on while a clip is being got ready to play (the short sound-system start-up step), the old clip isn't cancelled and starts playing over the new one. The longer second-hour lines and the quick line changes in the sponsor break make this much more likely. I haven't heard the overlap myself, so this cause is the most likely one, not confirmed.

## Fix
1. One voice at a time, guaranteed: the whole stream keeps a single "now playing" clip. Before any clip starts, whatever is playing is stopped first, so two can never sound together, wherever the stream is.
2. Re-check after every wait: each time the presenter waits (getting the clip, starting the sound, pressing play), she checks the screen hasn't moved on. If it has, that clip is dropped and never played.
3. Clean stop when the presenter leaves the screen (layout switches, page reload in OBS): any playing or pending clip and timers are cancelled.
4. Same fix in the older layout's presenter, so both behave the same.

Unchanged: what she says, timings, sponsor breaks, explainer and running order.

## Checks
- New automatic check: starting a second clip always stops the first; a clip whose line has been replaced is never played.
- Run the existing stream checks.
- Open the stream in the preview at 19:45–19:47 with sound on, if a voice sign-in can be made; otherwise report it as unheard.

## Technical details
- New `src/lib/voice-channel.ts`: module-level `claim(stop)` / `release(token)` holding the single active HTMLAudioElement stop function; pure and unit-tested.
- `OrbitPresenter.tsx` / `Presenter.tsx`: `if (g !== gen.current) return` after `fetchLine`, after `ctx.resume()`, and after `el.play()` (pause if stale); `cur.current` set to the pause function before any await following Audio creation; claim channel before `play()`; effect cleanup on unmount cancels `cur` and bumps `gen`; mime timers cleared on unmount.
