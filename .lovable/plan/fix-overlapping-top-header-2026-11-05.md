# Fix overlapping top header

## Problem
On wide screens (about 1280–1900px) the top bar tries to fit everything on one line: Globe, UK statistics, World, Maps, Compare, Emergency Preparedness, Agents, the "104 of 129 feeds live" pill, Watch live, theme, Sign out, Follow on X, Embed figures and Menu. There isn't room, so labels wrap onto two lines ("UK / statistics") and the feeds pill, Compare, Preparedness, Agents and Watch live are drawn on top of each other.

## Fix
- Never let any header label wrap: every link and button stays on one line.
- Show fewer top-bar links as the screen narrows, instead of squashing them:
  - Very wide screens (1536px+): Globe, UK statistics, World, Maps, Compare, Preparedness.
  - Large screens (1280–1535px): Globe, UK statistics, World, Maps only.
  - Smaller: no top-bar links (all stay in the Menu, as now).
- Move "Agents" (admin only) out of the top bar into the Menu's Admin section, where it already appears.
- Show the "feeds live" pill only on the very widest screens (1536px+); otherwise it stays inside the Menu, as now.
- "Follow on X" and "Embed figures" show only on wide screens; they stay in the Menu below that.
- Keep "Watch live", the theme switch, Sign in/out and Menu visible on every size. On phones "Watch live" shrinks to the red dot plus "Live".
- Nothing is removed from the site: every hidden item is still in the Menu.

## Check
Screenshot the header at 375, 768, 1024, 1280, 1440 and 1920px widths, signed in and signed out, in light and dark mode, and confirm nothing overlaps or wraps.

## Technical details
- File: src/components/layout/SiteHeader.tsx only.
- Add `whitespace-nowrap shrink-0` to nav links and header buttons; the left group gets `min-w-0 overflow-hidden`.
- Primary nav array gains a per-item breakpoint (`xl` vs `2xl`). Status pill changes from `xl:inline-flex` to `2xl:inline-flex`, and the Agents link is removed from the inline nav. Follow on X uses `max-xl:hidden` and Embed uses `max-2xl:hidden`.
