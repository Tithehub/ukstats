# Remove scandals from the live stream (website only)

Scandals and the Grooming Gangs Inquiry come off the stream in both UK hours. The /scandals page and the home page links stay exactly as they are.

## What changes on the stream
- The 3-minute scandals slot after the half-past headlines is removed. Its time goes to the NHS slot that follows (4 to 7 minutes), so everything after it, including sponsor breaks at about :15 and :45, keeps its current time.
- The scandals panel, its spoken lines ("go to ukstats.co.uk slash scandals") and its Next Up entry no longer appear.
- The half-past explainer, Site Tour, globe tour, sponsor breaks and the world hour are unchanged. Rented streams already had no scandals.

## Checks
- Update the running-order checks so they confirm scandals never appear in any hour and the hour still adds up to 60 minutes.
- Open the stream in the preview at the old scandals time and screenshot what shows instead.
- Nothing published without your go-ahead.

## Technical notes
- Remove the `scandals` entry from `UK_HOUR` in stream-schedule.ts and add its 3 minutes to `nhs`.
- Stop building `scandalsSegment()` in stream-rundown.ts; the panel component can stay unused or be deleted.
- Update the project note that says scandals are voiced on the stream.
