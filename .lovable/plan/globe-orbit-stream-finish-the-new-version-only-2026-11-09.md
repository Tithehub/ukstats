# Globe Orbit stream: finish the new version only

The current live stream stays exactly as it is. All work goes into the new Globe Orbit version at its own link (/globe/broadcast?layout=orbit), so you can test it in OBS next to the old one.

## What changes in the new version

1. **Presenter (brunette newsroom style)**
   - Redraw the presenter in the style of the image you picked: brunette, newsroom lighting, the same colours.
   - Her mouth moves in time with her voice, using the voice's own loudness, not a fixed loop. When she is silent she blinks, breathes and moves her head slightly.
   - She sits in the gap between the "Next up" list and the stats panel, and is labelled as an AI presenter.

2. **Voice**
   - She reads the same real scripts as today: each stat with its source and date, headlines word for word, warnings in the government's own wording, weather, and the 15-minute "About UKStats" break.
   - The voice uses the same private OBS voice link as now. Adding ?voice=off still mutes her.
   - Each segment's tiles and the globe are timed to her speech: the tile she's reading lights up while she says it.

3. **More animation with real figures**
   - **Globe:** it turns to the country being reported on, with a pulse ring and the country's name. It flies home to the UK for UK segments, and tilts for weather.
   - **Tiles:** more of them (up to 8). They flip in one by one, the number counts up to the real published figure, and a small trend line draws in where history exists.
   - **Moving backdrop:** red light streaks along the orbit lines, city lights twinkle, and there's a soft light sweep each time the segment changes.
   - **A different scene for each type of segment:** stats, headlines, warnings, weather, small boats and migration, flights, and sponsor breaks.
   - **Same data as the current stream:** the same running order and the same topics. Topics with no data are skipped. Nothing is invented.

4. **Check it**
   - Record a short run of the new version at 1920x1080 and check it for overlaps, voice timing and the globe turning.
   - Send you screenshots of each scene to review.

## Not touched
- The current default stream layout, the homepage player and rented streams (until you say "switch").

## Technical details
- Changes stay in the orbit variant: OrbitScene.tsx, the orbit branch of BroadcastView, and a new OrbitPresenter.
- The presenter portrait is generated as layered stills (base, mouth shapes, closed eyes). Her mouth is driven by an AnalyserNode on the existing voice audio element.
- The highlighted tile follows the script sentence index from scriptForCard.
- Tests are extended: sceneFor, countUp ending on the exact published string, and the tile-highlight order.
