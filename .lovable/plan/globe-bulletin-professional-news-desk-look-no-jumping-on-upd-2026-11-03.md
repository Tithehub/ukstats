# Globe bulletin: professional news-desk look, no jumping on updates

## What visitors will see
- **Broadcast-style bulletin card:** a fixed-height "lower third" layout. It has a navy header bar with a red ON AIR tag, the country name, the UK time and a countdown. Below that sit the segment tabs (Figures / Warnings / News) with progress bars, then a body area of fixed height.
- **Smooth changes:** each new segment or country fades and slides in. Nothing below the card moves, because the card keeps the same height on every segment, with long text trimmed and a "Read more" link to the full detail below.
- **Figures** show as a tidy 3×2 tile grid with large mono numbers and the year in small type, like a market board.
- **Warnings** show as a single "headline" card: the government name, the level badge, the quote (up to 3 lines) and the publication time.
- **News** shows as a fixed-size list of thumbnails, so images never resize the layout when they load.
- **Headline strip:** a continuously scrolling ticker (pauses when you point at it or touch it, and doesn't move for people with reduced-motion settings). The strip has a fixed height, so new headlines slide in without pushing anything.
- **Phones:** the bulletin sits at the top of the lowered country panel as a compact strip with the same fixed height. Controls become a single row of icon buttons. Nothing reflows when the country changes.
- **Updates in place:** when new warnings or videos arrive, they appear with a small "New" flash. The page doesn't redraw or scroll.

## Technical details
- `BroadcastPanel.tsx`: fixed `h-[...]` body per breakpoint, `key`-ed segment wrapper with `animate-in fade-in slide-in-from-right-2`. Line clamps; `tabular-nums` on countdown and figures; fixed image dimensions with `aspect-video`.
- New tokens in `src/styles.css`: `--onair` and `--desk` (header bar), plus a `ticker` keyframe utility with a reduced-motion override.
- `GlobeExplorer.tsx`: the headline strip uses a duplicated track for a seamless marquee, fixed height, `contain: layout`. Country details below the bulletin keep `min-h` so country switches don't shift scroll.
- Keep the country panel's scroll position on auto-advance (no scroll to top).
- Browser check at desktop 1280 and phone 390 widths: measure the bulletin's height across segment changes and confirm it stays the same.
