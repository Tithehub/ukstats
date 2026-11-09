# Globe Orbit stream, built for real and driven by live data

Instead of another mockup video, this builds the Globe Orbit look as a real, working stream layout. It's fed by the same stats, headlines, warnings and weather the current stream already uses, so it handles the same amount of data and never shows invented figures.

The current stream stays exactly as it is. The new look opens on its own link (the broadcast page with `?layout=orbit`), so you can test it in OBS side by side. Once you're happy with it, we switch it to be the default.

## What viewers will see
- **A globe that follows the story.** It rotates and zooms to each country being reported. That country lights up with a red pulse ring and its name appears on screen, and it flies back to the UK for UK segments.
- **Animated stat tiles.** These are a grid of 4 to 6 glass tiles for the current segment, filled with real published figures. Each new tile flips in, its number counts up to the real value, and the one she's reading glows yellow. Every tile shows its source and date.
- **A different look for each kind of segment:**
  - **Stats** (debt, cost of living, crime, NHS and so on): the tile grid plus a small chart, where the data has a history.
  - **Headlines:** a large headline card that flips through each one, labelled news or official.
  - **Weather:** the globe tilts to the UK with a weather overlay and the latest forecast tiles.
  - **Warnings:** a red-framed card with the government's own wording. The country flashes on the globe.
  - **Small boats / migration:** crossing tiles, with the migration layer on the globe.
  - **Flights:** the live planes layer, with emergency-squawk tiles.
  - **Sponsor and "About UKStats" breaks:** a full-width card with a QR code. The bottom-left sponsor card keeps rotating as now.
- **"Next up" rail:** the upcoming segments from the real running order, with the current one highlighted.
- **Bottom headline bar and real clock:** the bar scrolls real headlines, and the clock shows actual London time.
- **Animated presenter:** the existing talking presenter, whose mouth moves and who reads the same scripts, sits in the brunette presenter's spot. I'll redraw her in the brunette newsroom style from your chosen image, keeping the lip movement and the voice the same.

## Rules kept
- Only real published figures, official warnings and verbatim headlines appear. Topics with no data are skipped, exactly like today.
- Sponsor and recommended cards work the same as now, and rented streams get the same layout with their own branding.

## Technical details
- Add an `orbit` layout to the shared broadcast view, inside the fixed 1920x1080 frame, selected by a search parameter. The default layout stays unchanged.
- Reuse `buildRundown` / `countrySegment` / `stream-schedule` for segment order and timing. Each segment type maps to a scene component.
- The globe camera flies to `segment.country` using the existing EarthGlobe, in broadcast mode.
- Tile count-ups animate only the formatting of the real value string. If a value can't be parsed as a number, it's shown as published, with no count-up.
- Generate a new presenter portrait in the brunette style, and keep the existing mouth and blink animation in `Presenter.tsx`.
- Add tests: the segment-to-scene mapping, and that the count-up always ends on the exact published value.
- Overflow is checked through the existing studio fit report.
