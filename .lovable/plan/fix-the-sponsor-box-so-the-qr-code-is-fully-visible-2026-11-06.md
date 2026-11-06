# Fix the sponsor box so the QR code is fully visible

The sponsor box at the bottom right is too narrow for its contents ("Supported by", the sponsor's logo, and the QR code), so the QR code gets pushed off the right edge of the screen.

## Changes
1. Move the box in from the right edge so it no longer touches the side of the screen.
2. Fit everything inside it: the sponsor's logo gets a bit smaller and the QR code always shows in full, including the "Scan to see our sponsors" text.
3. Make the same fix in the portrait layout.
4. Check at 1920×1080 and in portrait that the box doesn't cover the news tickers, then show you a picture before publishing.

## Technical details
- `StreamSponsors` in `src/routes/globe_.broadcast.tsx`: logo becomes `min-w-0 flex-1 object-contain`; the QR tile and label become `shrink-0`; box anchored at `right-[24px]` with a set width.
