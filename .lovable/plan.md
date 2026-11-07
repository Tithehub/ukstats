# Bigger, easier-to-scan sponsor box on the live stream

## What changes
- Sponsor box grows from 416×104 to about 600×200 (landscape), still bottom-right, still one sponsor at a time for 10 seconds with the red progress bar.
- Sponsor logo/banner image shown much larger (about 300×110 instead of 40px tall), with name and tagline beneath.
- QR code grows from ~95px to ~176px on a solid white quiet-zone border with high error correction, so phones scan it from a TV or laptop screen. "Scan to visit" + the sponsor's website shown beside it in larger text.
- Portrait layout gets the same scaled-up box, kept clear of the Top 6 panel and presenter.
- Nothing else on the stream moves; sponsors' QR still goes to their own site with the YouTube tracking tag.

## Checks
- Screenshot the broadcast at 1920×1080 and portrait with the five sponsors, confirm nothing overlaps or is cut off (including the existing overflow checker).
- Decode the QR from the screenshot to prove it scans at stream resolution.

## Technical details
- `src/components/stream/BroadcastView.tsx`: update the three wrapper sizes (lines ~216, 232, 241) and restyle `StreamSponsors` (image h-[110px], QR via explicit size ~176, `level="H"`, `marginSize={2}`, white `bg-background` pad; text 16–22px).
