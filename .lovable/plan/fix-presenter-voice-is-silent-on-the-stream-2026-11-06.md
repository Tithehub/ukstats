# Fix: presenter voice is silent on the stream

## What I found
- On the published stream page, the voice is being made successfully: each line comes back as real audio.
- But each spoken line takes several seconds to make and lasts about 8–23 seconds, while the figure changes every 9 seconds. The page throws the voice away the moment the figure changes, often before it has started playing or within a few seconds. So most of the time, nothing is heard.
- OBS may also still be showing the old page or have UKStats muted. I can't check that from here.

## What changes
1. **No more cutting her off:** when a line starts, she finishes it. Cards that change while she's talking are skipped, and she picks up the current card when she's done.
2. **Lines made in advance:** the next few cards' lines are made ahead of time, so she starts speaking the moment a card appears.
3. **Shorter lines:** title, figure and source only, about 4–6 seconds each. The published date stays on screen but isn't read out. The calm newsreader instruction is kept.
4. **Visible sound check:** the presenter's label shows a small status — "Speaking", "Preparing voice" or "Voice blocked". If OBS's browser blocks sound, you'll see it on screen instead of guessing.
5. **Publish:** the page then reloads itself in OBS within about 5 minutes. If you did the one-time refresh earlier, there's nothing more to click.

## Still needed from you
- In OBS's Audio Mixer, the UKStats speaker icon must not be crossed out, and the source needs "Control audio via OBS" ticked. If the label shows "Voice blocked", tell me and I'll switch to a playback method that OBS can't block.

## Technical details
- `Presenter.tsx`: a queue keyed by line. It ignores new lines while `audio` is playing, then plays the latest card. Prefetch uses `speakLine` for upcoming cards, with a client-side Map cache. Status is `idle | preparing | speaking | blocked`, and `play()` rejection sets `blocked`.
- `scriptForCard` drops the date sentence. Tests are updated.
- `globe_.broadcast.tsx` passes the next 3 cards' lines.
