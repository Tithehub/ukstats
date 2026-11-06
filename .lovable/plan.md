Redesign the stream's sponsor banner. You see and pick a design here before anything on the stream changes.

## Step 1: three designs to choose from (pictures only, posted in chat)
Each one is drawn at full 1920×1080 over a stream frame, so you can see it in place. It shows two example sponsors, marked as examples, and the QR code to ukstats.co.uk/sponsors.

1. **News-channel corner bug.** A compact navy box in the bottom-right with a red "OUR SPONSORS" tab, a large sponsor logo and name, the QR code on the right, and a thin bar showing when the next sponsor appears.
2. **Lower-third strip.** A slim full-width bar just above the tickers, with sponsor logos sliding across and the QR code fixed at the end. Every sponsor is always visible.
3. **Sponsor card wall.** A bottom-right panel showing four sponsor tiles at once in a 2×2 grid, with the QR code beside it. Pages rotate if there are more than four.

All three keep the "Sponsor — not official data" label, use the Restore Britain navy and white, and don't cover the Top 6, figure card, tickers or presenter.

## Step 2: build the one you pick
- Swap the current sponsor box for your chosen design, in both landscape and portrait.
- Check it at 1920×1080 and in portrait so the QR code and logos are never cut off. Then wait for your "publish".

## Technical details
- Mock-ups saved to Files as PNGs and posted for approval.
- Build replaces `SponsorQr` and the sponsor box in `globe_.broadcast.tsx`, reusing approved sponsor rows and `SPONSOR_QR_URL`; tokens only, no hardcoded colours.
