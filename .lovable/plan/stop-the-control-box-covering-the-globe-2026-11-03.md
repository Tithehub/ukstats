# Stop the control box covering the globe

## What changes
1. **Slim bar by default.** The box over the globe shrinks to one slim row holding the country search and a "Layers" button. Most of the globe stays visible on both computer and phone.
2. **Layers panel opens on demand.** "Layers" opens the colour choice, the colour key and the Riots, Protests, Official and ACLED switches. A close button and the Escape key hide it again. On computers it opens as a narrow drop-down. On phones it opens as a sheet over the bottom half of the screen, then closes once you pick a layer so you can see the result.
3. **Small colour key.** When colouring is on, a small key sits in a corner of the globe on its own, so you can read the colours without opening the panel.
4. **Buttons out of the way.** On phones, Next warning, Next country, Spin and Reset become small icon buttons with labels for screen readers, so they no longer stretch across the bottom.
5. **Phone country panel.** It starts lowered to a short strip with the country name, so the globe stays visible. Tap to raise it.

## Not changed
- All existing controls, filters, shareable links and data rules stay the same.

## Technical details
- `src/components/globe/GlobeExplorer.tsx` only:
  - Collapsible overlay with local `layersOpen` state and `aria-expanded`.
  - Separate legend chip (absolute, bottom-right).
  - Controls switch to icon-only below `sm` (labels kept as `aria-label`).
  - Phone sheet `sheetOpen` defaults to false.
- Check in the browser at 1280 and 390 widths that the globe area is mostly clear and that layers, the legend, the controls and the panel still work.
