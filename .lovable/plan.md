# Remove the big sponsor panel from the stream

- Take the large "Thank you to our sponsors" panel off the stream. At the moment it covers the middle of the globe for 20 seconds every 5 minutes.
- Keep only the small rotating sponsor box in the corner, with its QR code to ukstats.co.uk/sponsors. It stays where it is now.

## Technical details
- `src/routes/globe_.broadcast.tsx`: remove the `SponsorRollcall` render and its component; keep `StreamSponsors` and `SponsorQr`.
- Check at 1920x1080 that the build is OK and nothing in the middle overlays the globe.
