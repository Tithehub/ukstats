Switch the site's livestream to the new YouTube stream

- Replace the current livestream (j2MJCjRAPHM) with the new one (5jSalnX6BsA) everywhere it appears: the UK Live player on the home page, the /live page, its preview thumbnail and the "watch live" links.
- Check the preview: the player loads the new stream and YouTube allows it to be embedded. If it says embedding is off, you'll need to tick "Allow embedding" for this stream in YouTube Studio.
- Shows in preview only until you publish; I'll ask before publishing.

Technical details
- One change: LIVE_STREAM_ID in src/lib/brand.ts.
