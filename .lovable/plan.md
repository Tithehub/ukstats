# Presenter "About UKStats" break every 15 minutes

## What viewers will see and hear
Every 15 minutes (at :00, :15, :30 and :45 London time), at the next gap between countries or data sections, the presenter does a short break of about 30–40 seconds. Then the stream picks up where it left off.

On screen during the break:
- A full "About UKStats" card with **ukstats.co.uk** in big letters and a large QR code to `https://ukstats.co.uk` (with stream tracking tags).
- The current approved sponsors shown one after another, with each sponsor's own QR code (the same box as now).
- The Top 6, the tickers and the presenter stay where they are.

## What she says (draft for your approval)
> "You're watching UKStats — the UK's independent register of official statistics. Every figure on this stream comes straight from government and official publishers, with its source, its date and when the next update is due. Nothing is estimated and nothing is made up. The site is free for everyone, forever. Visit ukstats.co.uk, or scan the QR code on screen to open it now."

Sponsor line, only when approved sponsors exist:
> "UKStats is supported by [Sponsor A], [Sponsor B] and [Sponsor C]. Thank you to our sponsors. Sponsors never choose or change our figures."

When there are no approved sponsors:
> "Want your business seen here? Find out how at ukstats.co.uk/sponsors."

Close:
> "Back to the figures."

Sponsor names are read exactly as they were approved. She never makes claims about a sponsor or recommends one.

## Rules kept
- The break is labelled "About UKStats", so it is never mistaken for a statistic. It adds no figures.
- The presenter, her voice and the ?voice=off option stay as they are.
- She only names sponsors that are approved and active.

## Technical details
- `src/lib/stream-script.ts`: add a pure function `scriptForPromo(sponsorNames: string[])` that returns the lines above. It joins names with commas and "and", and uses the fallback line when there are no sponsors.
- `src/lib/stream-schedule.ts`: add `PROMO_EVERY_MS = 15 min`, `PROMO_MS ≈ 35s`, and `promoAt(pos)`. These are clock-driven, so a reload lands on the same moment. The promo is placed at the first slot/country boundary after each quarter-hour, and the content is shifted rather than cut mid-card.
- `src/routes/globe_.broadcast.tsx`: add a `PromoCard` (domain plus a large QR) that shows while the promo is active. The Presenter's reading list is swapped for the promo script during the break, and sponsor names are passed in from the existing sponsor rows.
- Tests in `src/lib/stream-reading.test.ts`: the promo comes up every 15 minutes, the sponsor names appear in the script, the no-sponsor fallback works, and the script says "ukstats.co.uk".
