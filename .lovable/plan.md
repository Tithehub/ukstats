# Show the news screens on the home page globe too

## Why you can't see it
The "+ New screen" button, dragging and resizing were only switched on for the full-screen globe (the Globe page, or the "Open full-screen globe" link). You're on the home page, where the smaller globe had them turned off.

## Change
- Turn the news screens on for the home page globe as well. You get the same "+ New screen" button (up to 6 screens), drag by the title bar, resize from the corner, minimise, close and "Tidy".
- Screens stay inside the globe area, so the rest of the home page is untouched.
- Screens are saved separately for the home globe and the full-screen globe, so setting up one doesn't move screens around on the other.
- Narrow widths, including your current window size: the button stays visible and screens become swipeable cards.

## Technical details
- In `GlobeExplorer.tsx`, remove the `!compact` condition on `<NewsScreens>`, and pass a `storageKey` (`ukstats-news-screens-home` vs the existing key).
- `NewsScreens` gets an optional `storageKey` prop. Lower the narrow breakpoint so the home globe at about 900px still allows dragging.
- Browser check at 927×735 on `/`: open 2 screens, drag, resize.
