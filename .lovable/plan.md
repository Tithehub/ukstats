# Convert sponsor pictures to 1200 x 900 for the stream box

Each wide banner (3 wide to 1 tall) becomes a 1200 x 900 stream picture. Nothing is ever stretched or squashed: pictures are only scaled evenly and placed in position.

## How each one is made
- **Background:** the sponsor's own banner, enlarged evenly to fill 1200 x 900, softly blurred and darkened, so the colours match the brand. No invented scenery.
- **Main picture:** the banner's own subject (phone, card pack, coin, chip grid, yacht), scaled evenly at full sharpness and set in the middle-right. It stays clear of the left side, where the title and QR code sit, and clear of the far right, which tucks behind the presenter.
- **Banner wording:** the box already shows each sponsor's name and web address. The banner's own slogan is left off so two sets of words don't overlap. Logos stay where they're part of the picture (for example the YachtFino logo on the boat).

| Sponsor | Main picture kept |
|---|---|
| GoPharma.ai | Phone showing the app |
| RareItUp.com | Neon Series 1 card pack |
| gold.live | Gold Liberty coin |
| xpre.ai | Glowing chip grid |
| YachtFino.com | The yacht |

## Book cover
The cover you sent is the same small file I already used (342 px wide), so it can't get any sharper. Its current stream picture stays as it is. A cover at least 600 px wide would make it crisp.

## Using them
- Upload each 1200 x 900 picture as a site file and attach it to its sponsor only for the stream box. Website banners stay unchanged.
- Check every picture at full size and in the live stream box (title, QR, presenter edge) before showing you.
- Save copies in Files so you can reuse them.
- Nothing is published until you say so.

## Technical notes
- Stream pictures live in a small map in `BroadcastView.tsx` keyed by each sponsor's website domain, used ahead of the banner; other sponsors fall back to the banner, shown whole.
- Pictures are composed with PIL using only even scaling and cropping, with a check that the scale is the same both ways.
