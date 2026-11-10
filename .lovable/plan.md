# Sponsor card: picture fills the whole box

Make the stream's sponsor card match the screenshot: the sponsor's picture fills the entire card edge to edge, with the title, divider, QR and "Scan to discover more" sitting on top of it on the left.

## What changes
- The sponsor picture covers the full card, not just the right two-thirds. No more small centred picture on a blurred copy.
- A soft navy shade runs from the left edge across about half the card, so the white title and QR text stay easy to read over any picture.
- The picture is gently framed toward its right side, so the main subject shows beside the text, as in the screenshot.
- The card keeps its current angle, glass edge, size and position behind the presenter.
- Works for all current sponsors (YachtFino, RareItUp, GpPharma, gold.live, xpre.ai) and the book/inquiry cards. If a sponsor has no picture, the existing navy fallback stays.

## Not changed
- The classic stream, the website pages, the sponsor pictures themselves and the QR codes.
- Nothing gets published until you approve it.

## Check
- Take stills of each sponsor card in the stream preview, check the text is readable and nothing important is cut off, and share them with you.

## Technical details
- `BroadcastView.tsx` ~line 470: `orbit-sponsor-img` becomes `inset-0` full width; one `<img>` using `object-cover object-[70%_center]`; remove the blurred duplicate and `object-contain`.
- `styles.css` lines 489/497: replace the masks with a left-to-right navy overlay (pseudo-element, using theme tokens) instead of fading the picture out.
