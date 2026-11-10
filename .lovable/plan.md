# Orbit draft: left panels tuck behind the presenter, gentler right tilt

Preview only. This becomes part of the next live version once you approve it. Nothing is published, and the old live stream is unchanged.

## What changes
- **Left panels tuck behind the presenter.** The Next Up menu and the Recommended card get a little wider and sit one layer behind the presenter, so their inner edges pass behind her shoulder, as in your reference. Titles, times and the QR code stay in the visible part. Nothing important goes behind her.
- **Soft fade where they meet her.** A faint shadow on the panel edge next to her shoulder, so she looks like she's standing in front of the screens.
- **Right side more subtle.** The figure card and key-figure tiles go from a 10° lean to about 4°.
- **Further polish in the same pass:**
  - The panels drift slowly in depth.
  - The edge highlight brightens slightly on the item that's on air.

## Check
- UK and world stills compared with your reference. I'll check that she overlaps the panel edges neatly, the text and QR are fully visible, the QR still scans, and nothing is clipped.

## Technical details
- In BroadcastView.tsx, set the left column wrappers to z-[15] (presenter wrapper is z-20) and widen them to about 380px. Keep the content padded right so text stays clear of the presenter's silhouette.
- `.orbit-tilt-left` keeps rotateY(14deg) and gets a mask-image gradient that fades the inner 40px edge.
- `.orbit-tilt-right` changes to rotateY(-4deg).
- Add an optional slow `orbit-drift` keyframe (±1deg, 12s), switched off under reduced motion.
- Files: BroadcastView.tsx, styles.css.
