# Showing the latest main news on UKStats, legally

## Short answer
No. We can't cut 5–10 second clips from BBC, Sky, GB News or other broadcasters and replay them, even short ones. The footage belongs to them. In the UK, "fair dealing" doesn't cover news footage (photos are excluded too), and a short clip on a loop isn't commentary. YouTube's Content ID matches clips of just a few seconds, so the 24/7 stream would get copyright strikes and could be taken down. Three strikes deletes the channel.

## What we can do instead
1. **Website: official YouTube players for the latest news.** On the globe's news screens, and a "Latest news video" card for each topic, we show the broadcasters' own newest uploads through YouTube's official embedded player. This is allowed: the video plays from their channel, they keep the views and adverts, and we copy nothing. It uses the verified channel list we already keep.
2. **Live stream: headlines, no footage.** On the stream, broadcaster stories appear as their headline word for word, the outlet's name and the time, with a "Watch on [outlet]" line. Their footage never appears on our stream. The video box keeps playing our own licence-checked clips.
3. **Real news footage on the stream, later.** A paid agency licence (Reuters, AP or Getty news video) is the only legal way. The slot is already built and switched off while the payment hold is on.

## Limits
- The website players need the YouTube connection to work. If the YouTube feed is blocked from here (as it was before), those cards show "Watch on YouTube" links until it's fixed.
- A broadcaster can switch off embedding for a video. That video then shows as a link instead.

## Technical details
- New `LatestNewsVideo` component using `youtube-nocookie.com/embed/{id}`. Videos come only from the existing video-feed cache (verified channels), with titles shown word for word.
- It is hidden in broadcast mode (`/globe/broadcast`) so third-party video never enters the YouTube restream.
- The stream lower third keeps using headlines from the news-reports cache, credited to the outlet.
- A test checks that the broadcast page never renders a YouTube embed.
