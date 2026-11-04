# Live broadcast: hour-long UK block, headline issues, better clips, portrait and landscape

## What viewers will see

### 1. Hourly running order
- **The first 60 minutes of every hour are UK only.** The stream goes through every UK Stats topic that has published figures.
- **The next block covers other countries.** Each one gets about 5 minutes, using the same layout and only the figures it actually publishes. Countries with nothing published are skipped. Then it goes back to the UK hour.
- Timing follows the London clock, so "top of the hour = UK" stays predictable even after the page reloads.

### 2. UK hour: the major issues come first and come back often
```text
:00  HEADLINE  Irregular migration & small boats (8 min)
:08  Economy & public finances / national debt
:15  Cost of living
:22  HEADLINE  Small boats update (latest day, year so far, 7-day boats on globe)
:27  Crime & policing
:34  NHS & health
:40  Legal migration (visas) next to irregular migration
:46  Defence & national alerts / grooming gangs inquiry facts
:51  Skies now + news & police reports
:56  HEADLINE  Recap: small boats + top 3 figures of the hour
```
- Headline segments get a full-width "MAJOR ISSUE" title banner, a larger figure, and the globe zoomed on the Channel with the boat icons on.
- Every figure still shows its source, period, published date, how old it is and when the next release is due. Topics with no published figure are skipped. Nothing is estimated.

### 3. Video for each section
- The clip library grows from 8 clips to roughly 30–40. Every clip is checked for its licence. Sources are Wikimedia Commons, US government footage, and UK Parliament or No.10 footage where reuse is allowed under the Open Government / Parliamentary licence.
- Each topic gets a set of clips, labelled **Newest** or **Most viewed archive** (going by the Commons view counts where they exist). The stream alternates between the two.
- News-outlet footage stays blocked. If a topic has no licensed clip, it shows a still card with the source's details instead of an empty box. If we can't find legal small-boat footage, I'll tell you rather than use something unlicensed.
- The video box gets bigger, about a third of the screen in landscape. The credit and licence line stays on screen.

### 4. Text you can read on any screen
- All text is sized to the frame: the headline banner is about 64px, the figure about 120px and the tickers about 34px on a 1080p screen. It scales down evenly on smaller screens.
- High-contrast navy, white and red. At most two lines per banner. Text is never shorter than about 22px at 1080p, so it stays readable on a phone watching YouTube.
- The LIVE badge and the ukstats.co.uk line move out of the area YouTube's player buttons cover.

### 5. Landscape (default) and portrait
- **Landscape 1920×1080 is the default.**
- **Portrait 1080×1920** (for YouTube Shorts or vertical live) opens with `?layout=portrait`. Top to bottom: banner, globe, figure card, video, tickers.
- Studio gets a switch to preview either layout, and its "something is cut off" check works in both.

### 6. Same layout for every country
- One template is used for every country. Only the data changes: the country's own published figures, official warnings, migration figures where they're published, and clips tagged for that country or general clips.

## Technical details
- `stream-rundown.ts`: new `buildSchedule(now, data)` that returns timed segments within the hour, with headline flags and weights. `segmentAt(londonTime)` works out the current segment from the London clock. There's a per-country template builder. Tests cover these: minutes 0–59 are the UK; small boats appears at least 3 times in the hour; segments without figures are dropped; non-UK countries only get published metrics.
- `stream-clips.data.ts`: more clips, with `tier: "newest" | "archive"`, optional `country`, and checked dates. `clipsFor(topic, country)` rotates between the tiers. The existing licence tests are kept and extended.
- `globe_.broadcast.tsx`: layout tokens worked out from the frame size; the `layout` search param chooses 1920×1080 or 1080×1920; a headline banner component; the `[data-fit]` overflow reporting still works.
- `globe_.studio.tsx`: switch between orientations; the cover-up zones change to match each one.
- Nothing is added to the database. Clips are stored on the site's own file storage.
