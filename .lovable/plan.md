# Union Jack background (preview first)

## What you'll see first
Before anything changes on the site, I'll make two or three mock-up pictures of the homepage with the flag behind it so you can pick one:
- **Option A:** very faint (about 6% visible), large and zoomed into the centre cross.
- **Option B:** a bit stronger (about 12%) with a soft navy fade so the stats stay easy to read.
- **Option C:** the flag gently rippled like fabric, faint, top of the page only.

You choose one (or ask for changes). Only then do I apply it.

## After you pick
- Use a sharp, high-resolution Union Jack (drawn as a vector, so it stays crisp on any screen, including your Mac's Retina display).
- Place it fixed behind every page, zoomed in, partly see-through, under all cards and text.
- Keep text and figures readable: checked against the navy/white colours, desktop and phone.
- Leave it out of the livestream, embeds, widgets, share images and PDFs, so those stay clean.
- Nothing is published until you say so.

## Technical details
- Flag as an inline SVG (official 1:2 proportions, navy #012169 / red #C8102E / white) rendered in a fixed, pointer-events-none layer in __root, with opacity and scale set via design tokens in src/styles.css; optional fabric look via a generated high-res image uploaded as a CDN asset.
- Hidden on /globe/broadcast, embed and widget routes.
- Mock-ups made by screenshotting the homepage with each variant injected in the browser only, saved to Files for review.
