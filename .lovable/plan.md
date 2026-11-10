# Orbit draft: globe follows the presenter, voice in sync, reference-style lit globe

This is preview-only. The old live stream and ukstats.co.uk stay unchanged, and nothing gets published.

## 1. The globe follows each country the presenter talks about
- When a new country segment starts, the globe turns smoothly to that country. It slows as it arrives, then a red pulse ring and a pin land on the country.
- The country's name appears on the globe as a small glass label, and its border glows.
- In the UK hour, the globe stays on the UK. When a line names a UK nation (Scotland, Wales, Northern Ireland), it shifts slightly towards that nation.
- If a country isn't on the map, the globe stays where it is rather than spinning to the wrong place.

## 2. The presenter and the stats stay in sync
- Today the voice line and the figure on screen are picked separately, so they can drift apart. The voice also starts late, so she can still be reading the old figure after the new one appears.
- Fix: each step has one item, and the card and her line both come from it, so she always reads what's on screen.
- The next card only appears once she finishes the current line (with a safety time limit), and her next line is loaded while she's still speaking, so there's no gap.
- With the voice muted, cards move on at the current fixed pace.

## 3. A more colourful, modern globe like your reference and the 32-second video
- Countries are filled with a richer navy-to-electric-blue colour, with lit edges and glowing coastlines.
- City lights are warmer gold-orange with a soft glow.
- The country being reported gets a red/blue glow, matching the reference.
- Effects on top of the globe:
  - Glowing red streaks running along the orbit lines
  - Pulse rings
  - Twinkling lights
  - A soft light flare
  - A slow light sweep across the globe, as in the video
- All motion turns off for viewers who choose reduced motion.

## Check before showing you
- I'll take 1920x1080 stills of a UK segment and two different world countries, side by side with your reference image.
- I'll check that the globe faces the right country in each still.
- I'll check that her line matches the card on screen across at least three card changes.

## Technical details
- In BroadcastView, one `items[step]` will produce both the `card` and `orbitLine`, instead of indexing `reads` and `cards` separately.
- Steps will advance on the presenter's `onEnd` (OrbitPresenter callback, timeout fallback), and the next line's audio will be pre-fetched.
- OrbitGlobe will get a country outline fill layer, a highlighted border, a label sprite, eased slerp with arrival pulse, and a sweep shader. These changes stay inside the OrbitGlobe/OrbitScene files and the scoped orbit styles; the shared EarthGlobe is not touched.
- A small test will check that the line and the card come from the same item.
