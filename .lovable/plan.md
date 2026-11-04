# Add "Watch live" buttons for the broadcast page

Right now nothing on the main site links to the live broadcast page; it can only be reached by typing its address or from the Studio page.

## What to add
1. **Top menu**: a "Watch live" item with a small red dot, next to the Globe item, opening the broadcast page.
2. **Globe Layers panel** (home globe and full-screen globe): a "Watch the live stream" link under "Open full-screen globe".
3. Once the YouTube channel is live, the button can point to the YouTube watch page instead; until then it opens ukstats.co.uk/globe/broadcast in a new tab.

The Studio page stays unlinked (it is a control room for you, not for visitors).

## Technical details
- Locate the site header component and add a link to `/globe/broadcast` (target _blank, rel noopener).
- Add a matching link in GlobeExplorer next to the full-screen globe link, hidden in broadcast mode.
- One shared constant for the live-stream URL in src/lib/brand.ts so it can be swapped for the YouTube link later.
