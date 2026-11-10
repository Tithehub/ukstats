# Orbit draft: bring the menus and globe lighting up to the reference

This is preview-only. The old live stream and ukstats.co.uk stay unchanged.

## What's wrong now (comparing your left and right images)
- **NEXT UP menu:** The text is tiny, long titles wrap onto three lines, and the highlighted item is a bulky yellow block. Each row has only a small chevron. The reference has one clean row per item, with an icon tile, a bold title and its time underneath, separated by thin lines.
- **Recommended card:** The book thumbnail is tiny, the text is small and grey, and there's dead space. The reference has a bold uppercase title beside a picture strip, then a QR code with a short call to action.
- **Globe:** It looks flatter and darker than the reference. My last change recoloured the land a flat blue, and that was a step backwards. The reference has:
  - Darker, realistic land
  - Bright gold city lights that glow and bloom
  - Thin glowing lines linking cities, with light travelling along them
  - A warm highlight on the top-right edge
  - A crisp blue rim

## Changes

### 1. NEXT UP menu, rebuilt to the reference level
- One row per item: a square icon tile on the left (debt bars, boat, weather, warning, health, globe and so on, matched to each topic), then the title in bold uppercase on one line, with its real start time in smaller text underneath.
- Long titles get shortened to the topic name (for example "Small boats" instead of a full sentence), and anything still too long is cut off with "…", never wrapped.
- The item on air gets a thin red bar on the left and a soft glow, instead of the yellow block.
- Same glass panel, with thin dividers between rows and roomier spacing, to match the reference proportions.

### 2. Recommended / sponsor card, restyled
- A bold uppercase title (up to three lines) beside a larger image strip: the book cover, inquiry image or sponsor logo.
- Below that, a bigger QR code next to a short call to action and the web address.
- Larger, brighter text, and no empty bands.

### 3. Globe lighting closer to the reference
- Undo the flat blue recolour and go back to darker, realistic land and oceans with a cool blue tint.
- Make the city lights brighter gold with a soft bloom, so the lit regions glow.
- Add a network of thin glowing lines between major cities, with small light pulses travelling along them. The lines are decoration only and carry no data.
- Add a warm sun highlight along the top-right edge, and sharpen the blue rim.
- Keep the red orbit streaks and the country pulse ring. Make the reported country's border more visible, and move its name tag clear of the figure card.

## Check before showing you
- Take 1920x1080 stills of the UK hour and one world country, and place them side by side with your reference image.
- Check for wrapped or clipped menu text, and that every row has an icon and a time.

## Technical details
- `OrbitNextUp` and the sponsor/recommended card in OrbitScene/BroadcastView will get a topic-to-icon map (lucide) and a short-title helper.
- In OrbitGlobe:
  - Revert the land shader to the earlier texture-based colours and raise the city gain.
  - Add additive bloom sprites at the brightest city clusters.
  - Add great-circle arc lines between about 20 fixed major cities, with moving head sprites.
  - Add a terminator highlight sprite.
  - Move the label sprite left so it isn't covered.
- These changes stay inside the Orbit files and the scoped orbit styles.
