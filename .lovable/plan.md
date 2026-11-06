# Sponsor banner: one sponsor at a time, own QR code

## What you'll see
- A compact box in the bottom-right corner showing **one sponsor at a time**: logo (or name), short tagline, and a QR code that opens **that sponsor's own website**.
- Each sponsor shows for about 10 seconds, then the next one fades in, with a thin bar showing the time until the switch.
- Under the QR code: "Scan to visit" plus the sponsor's web address in short form, so viewers know where it goes.
- Kept small, about the size of the current box, so it doesn't cover the main figure card, Top 6 or the news bars.
- If a sponsor has no website saved, the QR code falls back to ukstats.co.uk/sponsors.
- Still labelled "Supported by", kept apart from the statistics.

## Steps
1. Rework the stream's sponsor box to the layout above, in landscape and portrait.
2. Make a picture of it with an example sponsor over a real stream frame for you to approve before publishing.

## Technical details
- `StreamSponsors` in `src/routes/globe_.broadcast.tsx`: QR value = sponsor `url` (only http/https, with utm_source=youtube added), else SPONSOR_QR_URL. Add `url`/`tagline` to the banner row type if missing in `sponsor-visibility.ts`.
- Progress bar driven by the existing `ms` clock; `data-fit` kept for overflow checks.
