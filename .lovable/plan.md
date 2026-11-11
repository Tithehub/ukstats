# Union Jack: waving cloth look (mock-ups first)

## What you'll see first
New mock-up pictures of the homepage (nothing on the site changes yet):
- A high-quality Union Jack picture made to look like real fabric: soft folds, ripples, light and shadow, as if blowing in the wind.
- Shown in the same faint, see-through style as before, in two strengths (faint and a little stronger).
- A short sample clip of the flag gently moving, so you can judge the animation.

You pick one; only then do I put it on the site.

## After you pick
- The flag sits behind every page, with a slow gentle waving motion (stays still for visitors who turn off motion on their device).
- Text and figures stay easy to read on desktop and phone.
- Left out of the livestream, embeds, widgets, share images and PDFs.
- Nothing published until you say so.

## Technical details
- Generate a high-resolution cloth flag image (correct Union Jack proportions and colours), host it as a CDN asset.
- Motion via an SVG turbulence/displacement filter animated slowly, plus a light sheen sweep; disabled under prefers-reduced-motion.
- Fixed pointer-events-none layer in __root; hidden on /globe/broadcast, embed and widget routes.
