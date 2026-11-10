## Make the sponsor QR codes scan

### Why they fail
In the stream copy I tested, a QR reader couldn't read any of the five sponsor codes. Four things work against them:
- They're small: 92 px on a 1920×1080 stream, which shrinks further on a phone camera pointed at a screen.
- They use the densest error-correction setting with a long tracking web address, so the squares are tiny.
- The white border around each code is only one square wide (scanners want about four).
- The whole sponsor card is tilted in 3D, so the code is skewed, which scanners struggle with.

### Fix (sponsor and recommended cards on the new stream)
- Keep the card tilted, but show the QR panel face-on (flat), so the code isn't skewed.
- Make the code larger, about 130 px, with a proper white border and plain black on white.
- Use a lighter error-correction setting and a shorter link (a short `?ref=stream` tag instead of two tracking tags), so the code has fewer, bigger squares.
- The classic layout's code (164 px, flat) gets the same shorter link and border.

### Check
- Capture each of the five sponsor cards from the preview stream and decode every QR automatically. Confirm each opens the right sponsor website.
- Share the stills. You can test with your phone on the preview before publishing.

### Technical
- `BroadcastView.tsx` ~494: wrap the QR in a counter-transform that cancels the card's rotateY, or place it outside the angled layer. Size 128–132, `level="M"`, `marginSize={4}`. Adjust card layout so the text still fits in the 400×300 box.
- `sponsorSite()` and `utm()`: set only `ref=ukstats_stream`.
- Verify with OpenCV `QRCodeDetector` on the Playwright stills.
