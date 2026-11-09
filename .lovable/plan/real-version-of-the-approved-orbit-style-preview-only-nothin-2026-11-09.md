# Real version of the approved Orbit style (preview only, nothing published)

The old live stream, the site and racing all stay unchanged. Nothing gets published.

## What you'll get
A 1-minute recording of the real new stream page, styled to match the example you approved, with real published figures, headlines, warnings and the presenter's real voice. I'll save it to Files as `ukstats-orbit-real-1min.mp4`, along with a contact sheet of stills.

## Changes to the new Orbit stream page only
- **Right card:** a big title (the stat or headline name, never cut short), one large real figure, and its source and date line, styled like the example's frosted navy card with a red underline. I'll remove the rise/fall percentage unless the publisher states it, which keeps us to the no-made-up-stats rule.
- **Segment animations, matching the example:**
  - UK Debt: the figure counts up to its final value, then shows exactly as published, with a small bar strip.
  - Small boats: a line chart draws itself from the published series.
  - Crime: bars grow.
  - Weather and warnings: a Britain map with the warning badge pulsing, with up to three real tiles beneath.
  - World: the globe turns to each country, that country lights up gold with a red pulse ring, and the card shows the country name and a real headline.
- **Bottom strip:** shows "UK STATS LIVE • UK" during UK parts and "• WORLD" during world parts. This fixes the fault in the example.
- **Next Up list:** the current item lights up red, as in the example.
- **Continuous motion:** red streaks on the orbits, twinkling lights, a shine across the title bar, a steady ticker of real headlines, and the real London clock, which runs steadily.
- **Presenter:** the same brunette, talking with mouth movement and a gentle sway, using the existing real voice.
- **Missing figures:** any segment without a published figure is skipped rather than shown with a placeholder.

## Checks before you see it
- I'll record the page at full HD for about a minute: UK opening, debt, boats, crime, weather and warnings, then the world turn through 2 to 3 countries, a sponsor card, and back.
- I'll pull stills from every segment and check for placeholders, cut-off titles, scrambled numbers, overlaps, empty tiles and wrong labels, then fix and re-record once if needed.
- The existing stream tests will be run.

## Technical details
- Edits are scoped to the Orbit layout code in the `/globe/broadcast?layout=orbit` components and its styles. The default layout is untouched.
- The recording uses headless Chromium with a forced segment order via a preview-only query parameter, captures speech audio, and is muxed with ffmpeg.
