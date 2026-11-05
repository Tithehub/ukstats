# Point the site at the new live stream

## What the screenshot shows
YouTube Studio shows **LIVE 4:15** and **Excellent** stream health, so the new stream is broadcasting. The site still points at the previous stream (8V2eM3migrE). That stream has ended, which is why ukstats.co.uk doesn't look live.

Zero viewers usually means the stream is set to **Unlisted** or **Private**. In Studio, go to **Stream settings → Edit → Visibility → Public**. Also tick **Allow embedding** so the stream can play on ukstats.co.uk.

## Changes
1. Switch the UKStats Live box on the home page and both "Watch live" buttons to the new stream, `9Pg3JdUQ8y0`.
2. Publish to ukstats.co.uk, then check on the published page that the box plays the new stream.

## Technical details
- `src/lib/brand.ts`: change `LIVE_STREAM_ID` to `"9Pg3JdUQ8y0"`. `LIVE_STREAM_URL` and `LiveStreamPanel` are built from that value, so they update with it.
- Optional follow-up (not part of this plan): use the channel's live embed so new streams appear without code changes. This needs the @ukstatsglobal channel ID.
