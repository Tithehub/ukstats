Embedding is now on: YouTube confirms the stream (DD4hgjN1KZc) can play on other websites, and ukstats.co.uk already uses it. Refresh the homepage and the player should work.

## Optional safeguard so visitors never see YouTube's error again
- Before showing the player, the site checks whether YouTube allows it on other websites.
- If a future stream has embedding off, visitors see a "Watch live on YouTube" card with the stream picture and a big button, instead of YouTube's error box.
- When embedding is on, the normal player shows as now.

## Technical details
- A POST server function calls `https://www.youtube.com/oembed?url=...&format=json` (401 = off, 200 = on), cached for a few minutes.
- The homepage live panel shows a fallback card with `https://i.ytimg.com/vi/<id>/hqdefault.jpg` when embedding is off.
