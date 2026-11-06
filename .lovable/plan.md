# QR code on the stream's sponsor box

Add a crisp QR code to the "Supported by" sponsor box (bottom right of the live stream) and to the "Thank you to our sponsors" panel, so viewers can scan straight to the sponsors page.

## What viewers see
- A white rounded tile with the QR code, captioned "Scan to see our sponsors" and "ukstats.co.uk/sponsors".
- Sized to scan from a phone held up to a TV or laptop (about 120px in the corner box, larger in the thank-you panel).
- The box still only appears when there are approved sponsors; no "advertise here" wording while payments are paused.
- The QR goes to the sponsors page (who supports UKStats), not checkout.

## Technical details
- `src/routes/globe_.broadcast.tsx`: in `StreamSponsors` and `SponsorRollcall`, render `QRCodeSVG` (already installed) with value `https://ukstats.co.uk/sponsors?utm_source=youtube&utm_medium=stream_sponsor`, level "M", margin included, on the solid white strap token.
- Keep `data-fit` so overflow is reported; check at 1920x1080 and 1080x1920 that it doesn't cover the existing site QR code, tickers or Top 6.
