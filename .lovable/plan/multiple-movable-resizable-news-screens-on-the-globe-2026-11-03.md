# Multiple movable, resizable news screens on the globe

## What you'll get
- A **"+ New screen"** button on the globe. Each click opens another floating news screen over the globe. Up to 6 at once, so the globe stays usable.
- Each screen is its own bulletin: pick a country (UK is the default for the first one), and it runs the same timed segments (stats, official warnings, latest news/videos), with its own play/pause and next-country controls.
- **Drag** a screen by its title bar to put it anywhere. **Resize** it from the bottom-right corner, with a minimum size so text never gets squashed.
- Title-bar buttons: minimise to a small tab, bring to front (click anywhere on it), and close.
- Positions, sizes and countries are remembered on that device. A "Tidy screens" button lines them up neatly.
- **Phones:** dragging isn't practical on small screens, so screens stack as swipeable cards in the bottom panel. Nothing changes there except that you can have more than one.
- The current single bulletin in the side panel stays as it is. Floating screens are an extra.

## Technical details
- New `src/components/globe/NewsScreens.tsx`: an overlay layer inside the globe container. Pointer-event drag/resize (no new dependency), clamped to the container, z-order stack, min 280×220.
- Each window reuses `BroadcastPanel` with its own country and running order from `globe-broadcast.ts`. Make `BroadcastPanel` fill its parent height when it's in a window, and keep the fixed height in the side panel.
- Window state (`{id,country,x,y,w,h,min,z}`) is stored in localStorage under `ukstats-news-screens` and read after hydration, so it doesn't cause hydration mismatches.
- Pure layout helpers (clamp, tidy grid, max-count) go in `src/lib/news-screens.ts`, with tests.
- Data queries are shared through the existing React Query cache, so extra screens don't fetch extra data.
- Browser check on desktop (open 3 screens, drag, resize, close) and on phone (stacked cards).
