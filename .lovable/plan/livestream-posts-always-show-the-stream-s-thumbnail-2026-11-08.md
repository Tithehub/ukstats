# Livestream posts always show the stream's thumbnail

## What changes
Every post from "Launch the livestream" will carry the YouTube stream's thumbnail picture, linked to the stream:
- **Bluesky**: a link card with the stream title and thumbnail. Today it posts plain text, so no picture shows.
- **Telegram**: sent as a photo with your message and link as the caption, so the picture always shows.
- **Discord and Slack**: a picture card with the title and thumbnail, attached to the message.
- **Mastodon**: the thumbnail uploaded with the post, described as "Livestream thumbnail", so it doesn't depend on Mastodon's own link preview.
- **X, Facebook, LinkedIn, Reddit, WhatsApp**: these sites make their own picture from the link. YouTube links already show the thumbnail there.
- The composer shows a preview of the thumbnail under the link box, so you can see what will post.

If YouTube has no thumbnail ready, the post still goes out with the link, and the result line says "posted without picture". It won't fail silently.

## Technical notes
- New pure helper `youtubeThumbnail(id)` in src/lib/stream-launch.ts (tries maxresdefault.jpg, falls back to hqdefault.jpg from i.ytimg.com), with tests.
- The server fetches the title from YouTube oEmbed and the image bytes from i.ytimg.com only; the host is fixed, so it can't be used to fetch arbitrary URLs.
- Bluesky: `com.atproto.repo.uploadBlob`, then an `app.bsky.embed.external` embed with title, uri and thumb.
- Telegram: `sendPhoto` with photo URL plus caption (1024-character limit is respected).
- Mastodon: `POST /api/v2/media`, then `media_ids` on the status.
- Discord: an `embeds[].image`; Slack: an `image` block.
- `postToSocialAccounts` result gains a `picture: boolean` flag, shown in the result list.
