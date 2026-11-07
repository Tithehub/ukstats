# Real product screenshots on the Rent page

## What you'll see
A "See what you get" strip near the top of the Rent page with four real screenshots, each with a short caption:
1. **Branded live stream:** the broadcast page at full 1920×1080, with the presenter, Top 6 panel and sponsor box.
2. **Embeddable widget:** the stats widget as it looks on someone else's website.
3. **Streamer dashboard:** the setup screen where customers choose layout, countries and presenter.
4. **Watch page:** the public page viewers land on.

Each caption names the screen and the date it was captured. The figures shown are real figures taken from the site, not mock-ups. The strip shows four across on desktop and becomes a swipeable row on phones. Clicking an image opens it larger.

## Technical details
- Capture with Playwright from localhost: `/globe/broadcast` at 1920×1080, `/widget`, `/rent/dashboard` (signed in as the test account, with no private details visible) and `/rent/watch`-style page.
- Save the screenshots as JPGs under `src/assets/rent/` and import them in `src/routes/rent.tsx`.
- Add `alt` text, lazy loading and design-token styling only.
