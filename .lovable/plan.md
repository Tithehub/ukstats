# Sponsors visible on YouTube + live camera video

## 1. Sponsors — make them unmissable
The corner sponsor box is built but only in the preview, so YouTube viewers never saw it.
- Make the box larger (about 560×140 in landscape) with the sponsor's banner and name in bold, solid white "Supported by" label.
- Add a full "Thank you to our sponsors" strip showing every approved sponsor at once for 20 seconds at the top of each 5-minute slot, then back to the rotating corner box.
- Still never on figures, Top 6 or tickers (existing rule).
- Publish, then load the published stream page at 1920×1080 and screenshot it to confirm sponsors show.
- You then click "Refresh cache of current page" on the UKStats source in OBS.

## 2. Live camera video — real live only
The earlier London cameras were short loops, so they were removed. This time:
- Search for public-authority cameras that stream continuous live video (not stills or loops) and allow reuse — e.g. council, port, harbour, highway and tourism-board live streams across the UK, then capitals for other countries.
- Add each only after checking it plays continuously and its terms allow rebroadcast; save the checked date.
- Match by place on screen: the city/region of the figure in the UK hour, the capital in other countries' slots. Label: "LIVE public camera — operator, place. Scene only, not the figure."
- If a camera drops, fall back to the 2026 recorded clip automatically.
- Honest limit: cameras on YouTube owned by others (EarthCam etc.) cannot be re-streamed onto your channel without permission — that risks strikes. If no reusable live feed exists for a place, that place shows the recorded clip.

## Technical
- globe_.broadcast.tsx StreamSponsors sizing + new SponsorRollcall overlay timed from msIntoHour.
- stream-cameras.data.ts: new entries with `live: true`, `kind: "hls"`; render via `<video>` with hls.js loaded client-only; failure → existing skip list → clip.
- Tests: non-live camera never shows LIVE; sponsor overlay never overlaps Top 6/figure card.
