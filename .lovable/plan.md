# AI news presenter for the live stream

Add a realistic presenter who reads out the figure on screen. Viewers are clearly told it's AI. It only reads published figures, word for word, and never makes up stats.

## What viewers will see and hear
- A presenter box on the stream, on the left above the scrolling news strips in landscape and above the figure card in portrait. It shows a realistic newsreader at a studio desk with a navy and white UKStats backdrop.
- A permanent label: "AI presenter · reads official figures only".
- Every time the figure card changes, the presenter reads a short script built from that card. For example: "Small boats. 412 people crossed the Channel on 4 November, according to the Home Office, published 5 November." If a figure isn't published, they say "No figure is published."
- While speaking, the presenter plays a talking clip. Between scripts, they play a still "listening" clip.
- The silent mode stays the default for anyone who doesn't want sound. The voice is on in the version OBS captures (`?voice=on`), so the old hum never comes back.

## How it's made
1. **Presenter footage:** the video generator turned down every request for a realistic talking person, so the presenter will be the approved still image (an invented person). On screen it gets a slow camera drift and a "speaking" light while the voice plays. A moving talking presenter would need a paid avatar service, which stays off while payments are on hold.
2. **Voice:** scripts are turned into speech with Lovable AI's text-to-speech, using a calm British newsreader voice. No extra key needed.
3. **Script builder:** a small, pure helper turns a figure card into a sentence. It uses only the card's title, value, period, source and published date, so the wording matches the screen exactly. Tests will check that it never adds a number that isn't on the card and that missing figures read "No figure is published".
4. **Caching:** each spoken line is saved by its exact wording, so repeated cards don't cost credits again. A line is spoken only once per card change.

## Honest limits
- The lips won't match the words exactly. The talking clip is a general speaking loop, not live lip-sync, because true live lip-sync needs a paid avatar service.
- Speech uses AI credits. Caching keeps the cost low, but it isn't zero.
- Sponsors, the Top 6 boxes and figures stay where they are. The presenter box never covers them.

## Technical details
- `src/lib/stream-script.ts` (pure) plus `stream-script.test.ts`.
- POST server function `speakLine` calls the Lovable AI Gateway TTS and caches the MP3 in storage by a hash of the text.
- `src/components/stream/Presenter.tsx`: two `<video>` loops, swapped on `audio.onplay`/`onended`. It's wired into `globe_.broadcast.tsx` on `cardStep` change and gated by `?voice=on`.
- `run.sh`/OBS: use the URL with `?voice=on` and unmute the UKStats source.
- An AGENTS.md rule: the presenter speaks only the text from the card script, and it's always labelled as AI.
