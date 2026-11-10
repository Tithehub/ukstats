# Stop presenter voice overlaps for good

Sorry this is still happening. The audit found the voice can still double up in these ways:

1. **Two copies of the stream page playing at once.** The "one voice at a time" rule only works inside a single page. The Stream Studio preview, a second OBS browser source, or a second browser tab each run their own presenter, so two voices can talk over each other.
2. **She reads ahead on her own.** When a clip ends she starts the next line herself, while the screen can start that same line at the same moment. Two clips get prepared, and a slow one can still start late.
3. **Gaps in the stop checks.** A few steps (sound start-up, analyser set-up) happen before she claims the voice, so a clip can slip through after the screen has moved on.
4. **Outside the page (to check in OBS):** if OBS records "Desktop Audio" while ukstats.co.uk or YouTube is open in a browser, the delayed YouTube copy of her voice is recorded over the live one. This would sound exactly like an overlap.

## What I'll change
- **One voice across every copy of the page:** pages on the same computer agree that only one plays the presenter. The newest OBS stream page wins; any other copy goes silent and shows "Voice playing elsewhere".
- **Studio preview always silent:** the preview in Stream Studio never plays her voice.
- **No reading ahead:** she only ever says the line on screen. One player handles one clip at a time: the old clip is fully stopped before the next one is fetched, and anything that arrives late is thrown away.
- **Claim first, then play:** she claims the voice before any sound set-up, and checks again just before playing.
- **Clean stops:** her voice stops when the page reloads, hides or changes slot.
- **Live overlap alarm:** if two clips ever play at once, the newer one is stopped straight away and the event is shown in Stream Studio, so we'd know exactly when.

## Checks
- Automatic checks that fire screen changes fast, have clips arrive late and out of order, and run two page copies together. In every case, at most one clip may play.
- Run the stream in the preview with voice on, through a sponsor break and the :30 explainer, using a session I set up myself. Record what plays, and confirm only one clip plays at any moment.
- Nothing published without your go-ahead.

## Technical notes
- voice-channel.ts: add a BroadcastChannel/Web Locks owner election across tabs and sources, plus an `activeCount` guard that throws away a second element.
- Presenter.tsx and OrbitPresenter.tsx share one `useVoicePlayer` hook (a state machine: idle, fetching, playing). Remove the `nextLine` read-ahead from `finish`, and `claimVoice` before `AudioContext`/`createMediaElementSource`.
- Pass `?voice=off` to the Studio iframe.
- Stop on `pagehide` and `visibilitychange`.
