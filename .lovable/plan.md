# Sponsor box: real sponsor artwork, name, full domain, own QR — example first

## What the box will show (one sponsor at a time, 10 seconds each, bottom-left)
- The sponsor's own stored banner picture (the 3:1 JPGs already approved for YachtFino, RAREITUP, GoPharma, Gold.live, XPRE) shown full, never cropped, filling the box edge to edge on the left.
- Under the picture: sponsor name in bold and the full web address (e.g. www.yachtfino.com) in large clear text.
- Right side: a large high-contrast QR code on pure white that opens that sponsor's own site (with the YouTube tracking tag).
- Small "Supported by" label and red 10-second progress bar kept.
- Box sits in clear space above the bottom tickers, never over the presenter, Top 6, globe QR, warnings or headlines; the recorded-footage clip shrinks slightly to make room. Portrait gets the same box in the empty area under the Top 6.

## Example before anything goes live
1. Render the real broadcast page (real backdrop, real figures, real sponsor records) at 1920×1080 and portrait.
2. Capture one screenshot per sponsor and decode each QR to confirm it opens the right site.
3. Post the screenshots here for you to confirm. Nothing is published until you say yes.

## Technical details
- `src/components/stream/BroadcastView.tsx` `StreamSponsors`: image `aspect-[3/1] object-contain` using `banner_link`/`banner_url`; name + `sponsorSite(r.url).label` showing full hostname (keep `www.`); QR `size≈160`, `level="H"`, `marginSize=2`, white/black.
- Wrapper ~640×220 bottom-left; tickers start after it; clip narrowed when sponsors present.
- Screenshots via Playwright, rewriting the sponsor request to the live environment so real sponsors appear.
