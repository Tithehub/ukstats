# Orbit draft: flat Next Up and right card, sponsor card like the reference

Preview only. Nothing is published, and the old live stream is unchanged.

## What changes
- **Next Up (top left):** No angle at all. It's square-on and flat-facing, and it still tucks just behind the presenter's shoulder.
- **Right figure card and tiles:** Also flat and square-on.
- **Sponsor card (bottom left):** It keeps its current angle. The layout is rebuilt to match the reference card:
  - The picture fills the top-right of the card and fades softly into the dark glass under the title. It's no longer a separate boxed strip.
  - A bold uppercase title sits top-left over the fade, three lines at most.
  - A thin divider separates the top from the bottom row.
  - The bottom row has a white-framed QR code on the left. On its right is a short uppercase call-to-action ("Scan to visit") with the web address underneath.
  - The card lifts slightly so the QR clears the desk line and stays fully scannable.
  - The Rape Gang Inquiry has no picture, so its card shows a dark navy and red graphic in the picture area rather than repeating the title.

## Check
- UK and world stills compared side by side with your reference. I'll check that both flat panels face forward, the sponsor card matches the reference layout, and the QR is fully visible and scans.

## Technical details
- BroadcastView.tsx: remove `orbit-tilt-left` from the Next Up wrapper but keep `orbit-tuck` and z-[15]. Remove `orbit-tilt-right` from the right column.
- Rebuild `OrbitSponsor`: relative card with the image absolutely positioned (right 0, top 0, about 60% width and 62% height). Use object-cover with a mask gradient (left and bottom fade), the title on top at z-10, a border-t divider, and a flex row with the QR (about 96px in a white frame) and the label. If there's no image, use a gradient token fallback.
- Move the sponsor wrapper up about 24px.
- Files: BroadcastView.tsx, styles.css (add `.orbit-sponsor-img` mask).
