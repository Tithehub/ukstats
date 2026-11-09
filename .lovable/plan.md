# Socials: Rupert Lowe on X

## What you get
- A new **Socials** page (`/socials`) showing Rupert Lowe's latest X posts, word for word, with date/time and a "View on X" link on each.
- Clearly labelled "Social media, not official statistics", and kept separate from the stats, reports and streams.
- Linked from the menu and the Restore Britain page in the same change.
- Posts refresh every 15 minutes; if X stops answering, the last good set shows with its "last checked" time.

## What you need to do
- Connect an X account when the connect card appears. It needs an X developer "Bearer token" (read-only). X charges for reading posts on most plans — the free tier allows very few reads, so a paid Basic plan may be needed. I'll show a clear "feed unavailable" notice rather than anything made up if access is refused.

## Technical details
- Link X connector (gateway), server function (POST) looks up `@RupertLowe` id then `/users/:id/tweets` (text, created_at, public metrics off).
- Cache in `payload_cache` key `x-rupert-lowe-v1` (15 min TTL, serve lastGood).
- Route `src/routes/socials.tsx` with own head(); add to nav + Restore Britain page; AGENTS.md rule.
- Nothing published until you say so.
