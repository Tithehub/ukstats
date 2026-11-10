# Official UKStats logo files

Rebuild your screenshot logo as clean, sharp artwork: three rounded bars (short, tall, medium), then "UK" in bold and "Stats" in regular. It uses the site's Archivo lettering and matches the logo on the website and in the PDF reports. I'll draw it from scratch rather than enlarge the small screenshot, so it stays crisp at any size.

## Versions
1. **Navy on white**: Restore Britain navy (#051D3F) logo on a white background.
2. **White on navy**: white logo on a Restore Britain navy background.

## Files saved to Files (in a "UKStats logo" folder)
For each version:
- **Vector (SVG)**: scales to any size, for print, signage and designers. The letters are converted to shapes so they look right on any computer.
- **High-resolution PNG**, 4000 px wide, for social media, video and documents.
- **Transparent PNG** with no background, for placing on photos or other colours.
- **Square icon** (bars only, 1024 px), for profile pictures and app icons.

## Checks
- View every file at full size: lettering shape, even spacing, bar proportions matching the site, no fuzzy edges.
- Check the transparent versions on both light and dark backgrounds.
- No changes to the website itself unless you ask.

## Technical
- Generate the SVG programmatically from the same geometry as the `logo()` function in `report-pdf.ts`. Outline the Archivo Black/Bold glyphs with fontTools, then render the PNGs with rsvg-convert. Output goes to `/mnt/documents/ukstats_logo/`.
