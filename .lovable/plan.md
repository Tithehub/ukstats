# UK Live on the home page: bigger video, tidy links underneath

## What changes
- The video fills the full width of the UK Live box instead of two-thirds, so it's much bigger on every screen.
- Underneath the video, in one tidy row: the "UKStats Live · 24/7" title and short notes on the left, and the share buttons, "Full-page live" and "Watch on YouTube" grouped together on the right. On phones they stack neatly.
- Nothing else changes: same stream, same sound button, same wording. The /live page uses the same box, so it gets the same tidy layout. Nothing is published.

## Technical details
- `src/components/LiveStreamPanel.tsx` only: remove `md:grid-cols-[2fr_1fr]`; player stays `aspect-video` full width; info block becomes `flex flex-col md:flex-row md:items-start md:justify-between gap-4` with text left and ShareRow + buttons right (`flex-wrap`).
- Check at 390, 768, 927 and 1440 px for no overflow.
