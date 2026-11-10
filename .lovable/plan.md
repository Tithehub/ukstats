# Orbit draft: angled glass panels on the left, like the reference

Preview only. Old live stream and ukstats.co.uk stay unchanged. Nothing published.

## What changes
- **Next Up menu and Recommended card** get a slight 3D tilt: the outer (left) edge sits nearer the viewer and the inner edge leans back towards the presenter, as in the circled area of your image.
- Both panels stack as one column with matching widths, so they read as a single angled screen wall.
- Glass look closer to the reference: deeper navy translucent fill, thin bright top edge, soft inner glow and a faint shadow behind, so the tilt reads as depth rather than distortion.
- Text stays sharp and readable (tilt kept small, around 12–15 degrees).
- The right-hand figure card gets the mirror tilt (leaning back towards the presenter) so the studio feels balanced, as in the reference.

## Check
- Stills at UK and world times, compared side by side with your reference, checking nothing overlaps the presenter and text isn't blurred or clipped.

## Technical details
- Wrap the left column (OrbitNextUp + OrbitSponsor) in a container with `perspective: 1400px`; apply `transform: rotateY(14deg)` with `transform-origin: left center` via a new scoped `.orbit-tilt-left` class in styles.css, and `.orbit-tilt-right` (rotateY(-12deg), origin right) on the hero card.
- Add `.orbit-glass-panel` styles (gradient fill, top highlight border, inset glow) using existing tokens.
- Files: OrbitScene.tsx, BroadcastView.tsx, styles.css. Reduced-motion unaffected (static transform).
