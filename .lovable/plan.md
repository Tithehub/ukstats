# Live video feed on the globe

A "Live feed" layer and panel showing the newest videos from the verified channels already on the globe, with their real YouTube thumbnails. Each video is pinned to its channel's country and clearly labelled. Public live streaming is on hold, like the funding pause.

## What visitors get
1. **Feed panel.** A scrolling list of the newest videos. Each card shows:
   - the YouTube thumbnail and title
   - the channel name and avatar
   - the publish time (UK time) and how long ago
   - a label: **Official** (government), **MSM** or **ALT / Independent**
   - a "LIVE" badge when the channel is broadcasting right now
2. **Filters.** Official, MSM and ALT/Independent can each be switched on or off, and visitors can narrow the feed to one country, the last hour or today. These choices stay in the web address so a view can be shared.
3. **Globe markers.** Small glowing pins sit on countries with videos from the last 6 hours; live broadcasts get a pulsing pin. Clicking a pin opens that country's videos. These pins are styled differently from the official warning markers so the two are never confused.
4. **Watching.** Clicking a card plays the video inside the page in YouTube's privacy-enhanced player (youtube-nocookie). Each card also has an "Open on YouTube" link.
5. **Updates.** The feed refreshes itself every 5 minutes while the page is open, with a "checked at" time.
6. **"Most relevant" ordering.** Live broadcasts come first, then newest first. Within the same hour, videos with more views come first, using YouTube's own view counts. The page explains this ordering. No AI picks or rewrites headlines.
7. **Legal notes on the page.**
   - "MSM and ALT/Independent channels are not official sources; UKStats does not verify their claims."
   - "Public live streaming is on hold pending legal review (Online Safety Act)."

## Rules kept
- Only the YouTube-verified channels already listed; nothing added automatically.
- Official warnings and statistics stay separate. News videos never create warning markers or change any figure.
- Video titles are shown exactly as the channels publish them.

## One thing that may need you
YouTube's free public video feeds wouldn't open from my test machine today (they returned "not found"). If they also fail from the live site, the reliable route is a free YouTube API key from Google. I'd ask you for that through a secure form, and nothing would show until it works.

## Technical details
- `src/lib/video-feed.ts`: pure parsers for the YouTube channel RSS (`feeds/videos.xml?channel_id=`), the Data API `playlistItems`/`videos` responses (live status, views), and the ranking and filter helpers, with tests.
- `src/lib/video-feed.server.ts`:
  - Fetches up to 20 channels per refresh, oldest-checked first, to keep edge subrequests bounded.
  - Caches in `payload_cache` "video-feed-v1" and serves the last good copy.
  - Refreshes after 5 minutes; keeps the last 48 hours.
- `src/lib/video-feed.functions.ts`: a POST server function plus query options (refetch every 5 minutes).
- `GlobeExplorer.tsx` / `EarthGlobe.tsx`:
  - a "Live feed" toggle in Layers
  - feed pins as a separate points layer
  - a feed tab in the side panel and the phone sheet
  - a lazily loaded nocookie player
- Search parameters: `feed`, `fk` (kinds), `fc` (country), `fa` (age).
- Add an AGENTS.md rule, then check in the browser on computer and phone sizes.
