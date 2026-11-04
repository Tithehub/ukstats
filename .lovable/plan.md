# Make the UKStats live stream unmissable (before going live)

Goal: become the free, trusted "always-on UK dashboard" people leave running and share, then add legitimate income later without ever charging for statistics. All income ideas stay switched off while the payment hold is on.

## 1. Make it useful (build now)

1. **"Release day" alerts on screen** — when an official figure is published (ONS inflation, Home Office boats, debt), the stream shows a "JUST PUBLISHED" banner with old vs new figure and source. This is the main reason to tune in: first place to see new numbers, with no spin.
2. **Countdown to next releases** — a corner strip: "Next: CPI inflation in 2d 4h". Gives viewers a reason to come back.
3. **Daily boats tracker graphic** — a large, clear running total for the year vs last year at the same date (already have the data), shown every UK hour.
4. **"Ask the stats" from YouTube chat (read-only)** — viewers type a topic (e.g. `!boats`, `!inflation`); the stream shows that figure card next. Only existing published figures, never answers made up. Needs the YouTube API key, so this waits until you add one.
5. **Shareable stat cards** — every figure on the stream gets a matching image at ukstats.co.uk that people can post to X/Facebook, with a QR code on screen pointing to it.
6. **On-screen QR code + short web address** — "Check any figure: ukstats.co.uk" so viewers move from the stream to the site.

## 2. Make it findable (around launch)

- Keyword-rich title and description per hour (copy already in Studio; add "UK small boats live", "UK inflation live").
- Chapters/clips: post a daily 60-second Short of the day's new releases (made from the stream's own figure cards, no broadcaster footage).
- Pin the stream on the channel, link it from the Watch live buttons (needs your watch link).
- Embed the live player on the home page and boats page once the stream exists.

## 3. Earn legitimately later (stays off until the hold lifts)

- Supporter memberships (existing £5 / £10 tiers, YouTube channel memberships too) — perks are badges and early access to new features, never figures.
- Approved sponsor slot on the stream ("This hour supported by…"), using the existing sponsor approval and banned-category rules.
- Business tier: embeddable widgets and data downloads with no branding, priced for organisations; stats stay free for everyone.

## Suggested order

Build items 1, 2, 3 and 6 first (no outside accounts needed), then 5, then 4 once a YouTube API key is available.

## Technical notes

- Release alerts: compare each metric's published date in the cached payload with the last one shown; banner driven by `stream-rundown` with no new figures created.
- Countdown uses each metric's existing "next release" date, rendered in London time via fmtDate.
- QR code generated client-side from a fixed URL; stat card images via a server route rendering the existing card.
- Chat commands need a YouTube Data API key (previously unavailable); fully read-only, matched only against existing metric ids.
- Income features remain behind FUNDING_PAUSED.
