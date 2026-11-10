# Show the scandals' site pictures during the stream's scandals slot

## What changes
During the UK hour's "Inquiry & scandals — background" slot, the screen currently shows no pictures. It will show the same picture each scandal already uses on ukstats.co.uk/scandals, changing as the presenter moves from one scandal to the next.

- **Picture panel:** a large picture beside the presenter, with the scandal's title, its status and the label "Background, not official statistics".
- **Credit line:** each picture keeps the photographer and licence credit it has on the site (freely licensed Wikimedia Commons photos of places and buildings, never living people named in a scandal).
- **No picture on the site:** if a scandal has no picture, a plain navy panel with its title is shown instead — nothing new is made up.
- **QR code:** a small QR code to ukstats.co.uk/scandals sits under the picture.
- Applies to the main stream in both UK hours. Rented streams still don't carry scandals. The voiced lines are unchanged.

Nothing is published until you approve.

## Technical details
- `stream-rundown.ts` `scandalsSegment`: attach `{ slug, title, status }` per scandal and map each script line to its scandal.
- New `StreamScandalPanel` (src/components/stream) reads `SCANDAL_IMAGES` from `scandals.images.ts`; rendered in Orbit and classic layouts when `seg.id === "scandals"`, indexed by the current reading step.
- Test: every scandal in the segment maps to its own site image or the null fallback.
