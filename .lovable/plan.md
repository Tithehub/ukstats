# Fold-away menus on the globe

## What you'll see
Every big panel and button bar on the globe can be hidden and brought back with one click, so the globe gets the space:

- **Country panel (side column):** a small arrow tab on its edge folds it away; the globe widens to fill the screen. Click the tab again to bring it back.
- **Toolbar (Search, Layers, Cameras, Key, view buttons):** a "Hide controls" button shrinks it to one small round button; click it to open again.
- **Layers, Key, Search and Cameras boxes:** already open/close from the toolbar; each also gets a clear close button.
- **Colour key and the warnings/headlines strips above the globe:** each gets a small hide button, with a slim "Show" tab left in place.
- **One "Full globe" button** hides everything at once; pressing it again (or Esc) brings it all back.

Your choices are remembered on that device, so the panels stay how you left them next visit. On phones the bottom buttons stay as they are, since they're already compact.

Applies to the homepage globe and /globe. The live stream layout is not touched.

## Checks
- Desktop and phone in the preview: fold and unfold each panel, use "Full globe", reload and confirm it remembers, and confirm the globe resizes to fill the freed space without blank areas.

## Technical details
- `GlobeExplorer.tsx`: add `hidden` state `{ aside, toolbar, key, ticker, headlines }` stored in localStorage key `globe-ui-v1`, read after hydration (useEffect) to avoid mismatches. Aside gets `lg:w-0 lg:p-0` collapse with a toggle tab button (`aria-expanded`, `aria-controls`). Toolbar collapses to an icon button. "Full globe" toggles all; Esc restores. Skipped when `broadcast`.
- Globe canvas resizes via existing container size observers (verify for both 3D and canvas fallback).
