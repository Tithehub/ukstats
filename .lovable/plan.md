# Move the sponsor banner under the home page hero

## Goal

Sponsors get far more visibility: the rotating banner appears directly under the main hero on the home page, instead of at the bottom of the page. The trust promise stays intact — sponsors never sit beside individual figures, in embeds/widgets, or on share images.

## Current state

- `SponsorBanner` is rendered at the top of `SiteFooter` (src/components/layout/SiteFooter.tsx), so it shows at the bottom of every page.
- The home page (src/routes/index.tsx) has: header → Vital signs → daily statement link → **Hero** → "Around the world" strip → capability strip → figure panels → footer.

## Changes

1. **Add a placement variant to `SponsorBanner`** (src/components/sponsor/SponsorBanner.tsx)
   - New optional prop `variant: "footer" | "hero"` (default `"footer"`).
   - `hero` renders as a rounded, bordered panel matching the other home-page sections (rounded-2xl, border-night-line/50), so it looks native to the page rather than like a footer band.
   - Rotation, region filtering, pause-on-hover, example fallback, and 3:1 uncropped image all unchanged.

2. **Place it under the hero on the home page** (src/routes/index.tsx)
   - Render `<SponsorBanner variant="hero" />` immediately after the Hero section, before the "Around the world" strip.
   - It remains clearly labelled "Sponsor" with the "All sponsors →" link.

3. **Avoid two banners on one page** (src/components/layout/SiteFooter.tsx)
   - Suppress the footer-zone banner when the path is `/` (home), using the pathname the banner component already derives. Footer banner stays on every other page.
   - The small `SponsorStrip` text line in the footer stays everywhere.

4. **Update the placement rule** (AGENTS.md)
   - Replace the footer-zone rule: sponsors render via `SponsorBanner` (home page under the hero; footer zone on all other pages) and /sponsors; still never on figure cards, embeds, widgets, or share images; region via `regionFromPath`; always labelled.

## Verification

- Playwright screenshot of the home page at desktop (1280px) and phone width: banner sits under the hero, before any figure cards, not cropped, correctly labelled; footer no longer shows a second banner on home; a country page still shows the footer banner.
- Typecheck and existing sponsor tests still pass.
- Publish only after you say so — this is currently preview-only work.
