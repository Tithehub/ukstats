# Point "Watch live" at the YouTube stream

1. Set the live stream link in src/lib/brand.ts (LIVE_STREAM_URL) to `https://www.youtube.com/live/6S8XLQGwmjs` (tracking part removed).
2. Both buttons (red "Watch live" in the top bar, and "Watch the live stream" in the globe Layers panel) open YouTube in a new tab.
3. The studio page's "open stream page" button keeps opening /globe/broadcast, because OBS still needs that page.
4. Check the build, then publish ukstats.co.uk so the buttons and the new stream page (Top 6 panel) go live.
