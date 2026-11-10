# Real globe in the explainer + HQ site walkthrough video

## 1. Explainer "Interactive globe" chapter uses the real globe
For the 40-second globe chapter (made 60 seconds), the decorative studio globe is swapped for the real interactive globe from ukstats.co.uk/globe.
- The globe fills the space behind the presenter. Its own keys and legends stay visible: the travel-advice scale, flights, migration and news markers, and camera pins.
- Layers switch on one at a time, in step with what she says:
  1. UK FCDO travel advice, with its key
  2. US State Dept levels 1–4, with its key (shown separately, never merged)
  3. Live flights (labelled not official)
  4. Migration routes
  5. News and police reports
  6. Public road cameras: the globe flies to a city with a live public-authority feed and opens the camera window, labelled "scene only"
- The camera shown is picked only from feeds already marked as continuous live video. If none is available at that moment, she skips the camera line rather than showing a still as "live".
- The presenter's script gains one line about the cameras. The chapter card on the right follows the layer currently on screen.
- After the chapter ends, the studio globe returns. The rest of the stream is unchanged.

## 2. HQ walkthrough video of the website
A short video of the live site at 1920×1080, 60 fps, scrolling and clicking through the main features with smooth cursor moves:
1. Home page: intro, headline figures with source and date, the live stream box
2. The globe: spin, pick a country, toggle layers, open a camera
3. Stats register: search, open a figure showing source, period and next release
4. Daily PDF reports page and a report cover
5. Rent UKStats page
6. End card: UKStats logo, ukstats.co.uk, @ukstatsglobal

- About 60–75 seconds, no voice. Light background music is optional.
- Recorded from the real site, so all figures are real published ones. Racing stays hidden.
- Saved to Files as `ukstats-site-walkthrough.mp4`. Before delivery I check it frame by frame for loading spinners, figures caught mid-count, cookie and pop-up overlap, and blank tiles.
- A phone-shaped (9:16) version can follow if you want one for social posts.

## Not changing
The old classic stream, rented streams, the public globe page and the website itself. Nothing is published.

## Technical details
- In BroadcastView, while `ex.chapter.id === "globe"`, render `<GlobeExplorer broadcast>` in place of OrbitGlobe, with a new `showKeys` prop that keeps legends visible in broadcast mode. GlobeState is driven from a new `globeTourStep(msIn)` in stream-explainer.ts (`layer:"uk"` → `layer:"us"` → `fl` → `mg` → `nw` → camera city + camId).
- The camera comes from the existing public-cams registry, filtered to live HLS feeds, with no-live fallback logic.
- Test: tour steps fire in order and the camera step is skipped when no live feed exists.
- Walkthrough: a Playwright script with recordVideo at 1920×1080 against localhost, then ffmpeg to H.264 60 fps at about 12 Mbps and a fade at the end. Scripts and recordings are kept in /tmp; only the final MP4 goes into Files.
