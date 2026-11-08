# Add zoom in (+) and zoom out (−) buttons to the globe

- Add a **+** and **−** button to the globe's camera controls, next to Whole world / Tilted / Focus (bottom right), on both the home page globe and the full globe page.
- Each press zooms smoothly in or out one step. The globe stays on the place you're looking at, so it won't jump to another country.
- Pressing a button also stops the automatic country tour, like clicking the globe does.
- The buttons also show on phones, where the rest of the control panel is hidden.

## Technical notes
- GlobeHud: add `"in" | "out"` to the `onPreset` kinds; render two buttons (lucide Plus/Minus, aria-labels "Zoom in"/"Zoom out") in a small group that stays visible on mobile.
- EarthGlobe preset effect: for `in` multiply current altitude by 0.6, for `out` by 1.6, clamped 0.15–4, keeping current lat/lng, 500ms; disable autoRotate; update the CAM readout.
- Verify in Playwright that clicking + lowers the CAM km and − raises it.
