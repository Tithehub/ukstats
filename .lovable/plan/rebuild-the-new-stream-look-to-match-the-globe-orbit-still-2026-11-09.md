# Rebuild the new stream look to match the Globe Orbit still

Works only on the new draft stream (`/globe/broadcast?layout=orbit`). The old live stream, the home page and the live site stay exactly as they are. Nothing is published.

## Target look (from your uploaded still)
- Dark navy studio, large glowing 3D globe on the right with city lights, red orbit lines and a red pulse ring on the country being reported.
- Brunette presenter centre at the desk, mouth moving with her voice and gently swaying.
- Top left: red LIVE plus a place badge, for example LONDON.
- Left: one glass sponsor card with a large QR, the same as now.
- Lower third: red "UK STATS LIVE" plus a yellow section name, for example WORLD, UK or WEATHER.
- Bottom: yellow BREAKING NEWS tag, a smooth scrolling line of real headlines, and a red London clock.
- New: a slim glass stats rail along the right edge, with up to four cards. These show national debt, small boats, inflation, the weather warning level and the terror threat level.

## Real figures only
- Every card uses the same published figures, warnings and headlines the site already shows. Nothing is typed in by hand. The debt figure shows whatever the publisher last filed, so £3,005bn appears only if that is the filed figure.
- Each card shows the publisher tag (ONS, Home Office, Met Office, MI5 and so on), the reference period, and "checked today" or the last-checked time.
- A missing figure is not shown as "0". If a figure hasn't loaded, the card is skipped. Counters roll up once and end on the exact published number, and figures that contain more than one number never animate.

## Polish and layout
- Glass cards: soft blur, thin light border, Archivo headings and IBM Plex Mono for the numbers.
- Animations run on the graphics card so motion stays smooth, and nothing jumps when a value changes.
- A fixed 1920×1080 frame is scaled to the window, so OBS and browsers show the same picture. The frame has no sideways scroll, and the text never wraps or clips.
- Dark gradients sit behind the text so it stays readable over the globe.

## Checks before showing you
1. Take still frames of every segment: UK, debt, boats, weather, warnings, headlines, world and sponsor.
2. Check the stills for overlaps, clipped text, blank cards and any "0" or half-counted numbers.
3. Send you three stills to approve. A video comes only after you approve the stills, to save credits.

## Technical details
- Rework `OrbitScene.tsx`, `OrbitBackdrop.tsx` and the orbit overlay in `BroadcastView.tsx`. Add `OrbitStatsRail.tsx`, which reads from the existing rundown and metric queries.
- Leave the classic layout code paths untouched.
- Add tokens for glass, onair red and ticker yellow to `src/styles.css`, with no hardcoded colours.
- Add a fit check with `[data-fit]` on every text box, a Playwright stills script under `/tmp/browser`, and a test that a missing metric renders no card.
- Update the stream `AGENTS.md` Orbit rule.
