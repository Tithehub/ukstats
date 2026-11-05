# Live stream on the ukstats.co.uk home page

## What you'll see
- A new **"UKStats Live"** box on the home page, just under the globe, with a red LIVE dot and the YouTube player for your stream.
- **Fast loading:** the box first shows a still image with a play button. The YouTube player only loads when someone clicks it, so the home page stays fast.
- Under the player: "Watch on YouTube" (opens the stream), plus one line explaining that the figures shown on the stream come from the official publishers.
- On phones the player fills the width; on desktop it sits beside a short "What's on now" note (UK hour on even London hours, other countries on odd hours).
- It never appears inside the stream page itself, so the stream can't show itself.

## Technical details
- Add `LIVE_STREAM_ID = "6S8XLQGwmjs"` to src/lib/brand.ts, and build LIVE_STREAM_URL from it.
- New src/components/LiveStreamPanel.tsx with a click-to-load iframe from `https://www.youtube-nocookie.com/embed/<id>?autoplay=1&mute=1`. The still image comes from i.ytimg.com. The text uses the existing design tokens.
- Render it in src/routes/index.tsx below GlobeExplorer.
- The existing no-embeds test keeps the broadcast page free of YouTube players.
- Preview only until you say "publish".
