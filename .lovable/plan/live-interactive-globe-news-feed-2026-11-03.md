# Live interactive globe news feed

Turn the globe into a live news desk: it refreshes itself and shows the newest videos and live broadcasts from the verified channels already listed, next to the official warnings. Public live streaming from visitors is left out for now.

## What visitors will see
- A **Live** tab beside the warnings list on the globe (home page and full-screen globe).
- Feed cards: real YouTube thumbnail, the title exactly as the channel wrote it, channel name and picture, publish time (UK time) and how long ago, a label (Official / MSM / Alternative), and a red **LIVE** badge while a channel is broadcasting.
- Order: live broadcasts first, then newest first.
- Filters for kind, country and age (last hour, 6 hours, today). These stay in the web address so a view can be shared.
- Glowing pins on countries with videos from the last 6 hours; live broadcasts pulse. Clicking a pin flies the globe there and opens that country's videos. These pins look different from the official riot/protest markers so the two can't be confused.
- Clicking a card plays the video on the page in YouTube's privacy-enhanced player, with an "Open on YouTube" link.
- The feed updates itself every 2 minutes while the page is open: new items slide in at the top and are briefly marked "New", with a "Last checked" time and a pause button.
- Official warnings also update automatically every 5 minutes, without reloading the page.
- Notes on the page: "MSM and Alternative channels are not official sources; UKStats does not verify their claims." and "Public live streaming is on hold pending legal review."

## Rules kept
- Only the YouTube-verified channels already in the list. Nothing gets added automatically.
- News videos never create warning markers or change any figure.
- No AI picks, ranks or rewrites headlines.

## One thing you may need to provide
Earlier tests from my machine couldn't open YouTube's free public channel feeds. I'll try them first. If they fail, the reliable fix is a free YouTube API key from Google. I'd ask for it through a secure form, and the Live tab would say "Feed not connected yet" until it works. It would never show made-up items.

## Technical details
- `src/lib/video-feed.ts`: pure parsers (RSS and YouTube Data API) plus ordering/filter helpers, with tests.
- `src/lib/video-feed.server.ts`: polls channels in batches of up to 20 per refresh, live status via the API when a key is available, payload_cache "video-feed-v1", serves the last good copy, 2-minute TTL.
- `src/lib/video-feed.functions.ts`: POST server function + queryOptions with refetchInterval 120s; the unrest query gets refetchInterval 300s.
- GlobeExplorer: Live tab, separate points layer for feed pins, lazy nocookie iframe, search params feed/fk/fc/fa.
- AGENTS.md rule for the feed's source boundary.
