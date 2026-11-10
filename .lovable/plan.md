## Sponsor card label colour

Change the "Supported by" label on the stream's sponsor box from red to a bright blue (sky blue, readable over every sponsor picture). The same label is used for the recommended cards (inquiry, book), so they change too.

First step after approval: show you a side-by-side picture of the sponsor box (GoPharma and YachtFino) with the label in bright blue and in white. You choose, and I apply only that colour.

### Technical
- `src/components/stream/BroadcastView.tsx` line ~487: replace `text-destructive` on the tag with a new semantic token `text-sponsor-tag`.
- `src/styles.css`: add `--sponsor-tag` (bright blue, approx. oklch(0.78 0.15 235)) and map it in `@theme` as `--color-sponsor-tag`; add a faint dark text-shadow for legibility on light pictures (GoPharma).
- Leave line ~510 (the classic stream's red badge) unchanged.
- Check with a screenshot of the sponsor box on the preview stream; no publish.
