# Live stream preview ("studio") — see exactly what YouTube will show

## What you get
A new page, **/globe/studio**, that shows the stream picture exactly as viewers will see it, live and updating in real time, so you can check it before pressing "Go live" in YouTube Studio.

- **Live 16:9 preview** of the stream page, scaled down to fit your screen but laid out at true 1920x1080, so nothing is cropped or misplaced on YouTube.
- **"What viewers see" overlay check**: LIVE badge, London clock, source line "Data from official sources — ukstats.co.uk", rotating country bulletin, news ribbon, flights, boats and news markers — all running for real.
- **Safe-area guides** (toggle): shows where YouTube's own buttons and title cover the picture, so nothing important sits underneath.
- **Go-live checklist** beside the preview, ticked on your device only:
  1. Channel verified and 24-hour wait finished
  2. Stream key pasted on the streaming computer (never on the site)
  3. Streaming computer running the stream script
  4. YouTube Studio shows "Excellent" connection
  5. Title, description and "not official news" wording set (ready-to-copy text provided)
  6. Press "Go live" in YouTube Studio
- **Copy-ready YouTube text**: suggested title, description with source credits and the no-ads / not-endorsement note while payments are paused.
- Button to open the full-size stream page in a new tab (that is the page the streaming computer captures).

The stream page itself is unchanged, so what you preview is what goes out. Studio page is hidden from search engines and not in the menu.

## Not included
- The site cannot press YouTube's "Go live" button or hold your stream key — that stays in YouTube Studio and on the streaming computer.
- No sound added.

## Technical details
- New route `src/routes/globe_.studio.tsx` (noindex head), embeds `/globe/broadcast` in an iframe at 1920x1080 with CSS `transform: scale()` to fit the container; safe-area overlay as absolutely positioned dashed boxes.
- Checklist state in localStorage (`ukstats-studio-checklist`), read after hydration.
- Copy text constants in `src/lib/stream-copy.ts`; clipboard feedback only after the write resolves.
- Browser check of the studio at 927x735 and 1280x1800.
