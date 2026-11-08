# Add the inquiry and the book to the stream's sponsor box

## What you'll see
The bottom-left sponsor box on the live stream keeps showing one item at a time for 10 seconds. Two new slides join the rotation after your five sponsors:

1. **The Rape Gang Inquiry — Rupert Lowe MP and Restore Britain**: a red title card (there's no official cover picture), the website name therapeganginquiry.org, and a big QR code to the inquiry website.
2. **The Grooming Gang Cover-Up — Tommy Robinson and Peter McLoughlin**: your uploaded cover picture, with "amazon.co.uk" underneath and a big QR code to the Amazon UK page.

These two slides say "Recommended" in the corner, not "Supported by", so viewers don't think they're paying sponsors. They show on your UKStats stream only, not on streams rented by other people. Nothing near the figures changes.

## Technical details
- In BroadcastView.tsx, build a rotation list = sponsor rows + two fixed "independent work" slides (from INDEPENDENT_WORKS links + cover asset), each with its own QR (UTM tagged youtube/ukstats_stream).
- Corner label switches by slide type; hidden when the view has a rent StreamBrand.
- Box also shows even when there are no sponsors (the two slides alone).
- Check with a screenshot of /globe/broadcast at each slide time.
