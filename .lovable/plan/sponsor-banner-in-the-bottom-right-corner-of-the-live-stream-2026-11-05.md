# Sponsor banner in the bottom-right corner of the live stream

## What viewers will see
- A small rotating "Supported by" box in the bottom-right corner of the stream, just above the scrolling news strips.
- It shows every currently approved sponsor's banner in turn, about 10 seconds each, with the sponsor name.
- It sits clearly apart from the figures, with a thin "Sponsor" label, so paid placement is never mixed with the statistics.
- If there are no approved sponsors, the box doesn't appear. It shows no placeholder and no "advertise here" message, because payments are on hold.
- It will be sized to fit landscape and portrait without covering the figure card or YouTube's player buttons.

## Rules kept
- It uses the same approved sponsor records as the website footer banner, so unapproved artwork never shows.
- It is never placed on figure cards, the Top 6 boxes or tickers.
- It is separate from the Restore Britain dedication.

## Technical details
- `globe_.broadcast.tsx`: load the active sponsors with the existing `getSponsorBannerBoard` (POST server function), using the UK region and re-checking every 15 minutes.
- New `StreamSponsors` component: rotates with `cardStep`, keeps banners at their true 3:1 shape, and reports overflow via `data-fit`.
- Landscape: about 420×140 at the bottom right, above the tickers, with the aside shortened to fit. Portrait: next to the QR code.
- Add a rule to the sponsor AGENTS.md: the stream shows sponsors only in its corner banner, never on figures.
- Check in the browser at 1920×1080 and 1080×1920.
