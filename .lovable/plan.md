The live site already uses your new stream (DD4hgjN1KZc). The error message comes from YouTube: this stream doesn't allow playing on other websites.

## What you need to do (2 minutes, in YouTube Studio)
1. Go to studio.youtube.com, then Content, then the Live tab.
2. Click the pencil (Details) on this stream.
3. Click "Show more" and tick **Allow embedding**, then Save.
4. For future streams: Create, Go live, Manage, then Edit default stream settings and tick Allow embedding, so every new stream has it on.

When that's on, the player on ukstats.co.uk works without any change from me.

## What I'll change on the site so visitors never see the error
- Before showing the player, the site checks whether YouTube allows it on other websites.
- If it doesn't, visitors see a clear "Watch live on YouTube" card with the stream picture and a big button that opens the stream on YouTube, instead of YouTube's error box.
- Once you turn embedding on, the normal player comes back by itself.

## Technical details
- Small POST server function calls `https://www.youtube.com/oembed?url=...&format=json` (401 = embedding off, 200 = on), cached for a few minutes.
- The homepage live panel shows a fallback link card with `https://i.ytimg.com/vi/<id>/hqdefault.jpg` when the check says embedding is off. Same for any other page that embeds the stream.
