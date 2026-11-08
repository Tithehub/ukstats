# Bring back the presenter's voice on the live stream

## Why it's silent
The recent security fix made the presenter's voice work only for signed-in users, so strangers can't run up voice costs. The stream computer (OBS) isn't signed in, so every voice request is refused and she only shows her words on screen.

## Fix
- Create a private stream key: a long secret code that only your OBS link contains.
- The presenter's voice works if either you're signed in or the page's link carries that secret code. Everyone else stays refused, so there are still no surprise costs.
- Give you the new OBS link to paste into the OBS Browser source, for example `ukstats.co.uk/globe/broadcast?voicekey=…`.
- Add a red "Voice off — not authorised" note to /globe/studio so you can see straight away if the voice is blocked.
- Remind you of the OBS setting: in the Browser source, tick "Control audio via OBS" and make sure that source isn't muted in the audio mixer.

## Safety limits that stay in place
- Each line is capped at 400 characters, and identical lines are cached so they are only voiced once.
- The secret code is checked on the server and never shown on the page or in shared links. Share and embed links strip it out.
- `?voice=off` still mutes her.

## Technical notes
- New secret `STREAM_VOICE_KEY`, generated server-side.
- `speakLine` drops the strict `requireSupabaseAuth` middleware. It accepts either a valid bearer token (verified via `getClaims`) or a `voiceKey` input, compared with the secret in constant time.
- The broadcast route reads `voicekey` from the URL search params into memory and passes it to Presenter → speakLine. It is removed from the visible URL with `history.replaceState`.
- Add a test: a wrong key is refused and the right key is allowed.
- Publish needed; OBS picks up the change within about 5 minutes, or straight away after refreshing the Browser source.
