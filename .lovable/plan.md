# Tidy-up fixes 1 to 5

1. **Globe search on phones:** put the search box on its own full-width row on small screens, with Go, Layers, Key and Share underneath, so "Find a country…" shows in full.
2. **Empty globe while loading:** show a centred "Loading globe…" message with a soft spinner at every size, so the dark area never looks broken.
3. **Country name capitals:** show the country panel heading with proper capitals ("United Kingdom"), using the registry's country name instead of the lowercased search text.
4. **Less crowded globe panel:** below desktop width, stack the country panel under the globe at full width instead of squeezing it beside the globe. Keep the warnings bar to one line that scrolls sideways.
5. **Rent page countries:** group the country buttons under "United Kingdom", "Europe" and "Rest of the world" headings.

After the changes, I'll take new pictures at phone, tablet and desktop sizes. You'll get them as before-and-after pairs in Files.

## Technical details
- All changes are in src/components/globe/GlobeExplorer.tsx (toolbar grid, loading fallback, heading taken from the countries registry, stacked panel below lg) and src/routes/rent.tsx (country options grouped by region).
- These are layout changes only. Figures, sources and data loading stay the same.
