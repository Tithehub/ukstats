# One theme across the site, with a light/dark toggle

Right now the new home page is dark ("night" tokens) while the register, widget builder, create, my-pages and shared page routes use the older light palette. This makes the dark UKStats look the site-wide default, adds a proper light mode, and tightens overall quality.

## What changes

### 1. One themable palette
- Turn the existing page tokens (`ground`, `ink`, `steel`, panel, line, accent, freshness and official alert colours) into theme-aware variables with a dark set and a light set.
- Dark is the default. The light set is a properly designed daylight version of the same design — not the old page reused — keeping the same type, spacing and rules.
- Official alert colours (green/yellow/amber/red/crimson) keep their published meaning in both themes, tuned only for contrast.

### 2. Theme toggle
- A small sun/moon toggle in the header, present on every page.
- Choice is remembered in the browser; first visit follows the system setting, defaulting to dark.
- Applied before first paint so there is no flash of the wrong theme.

### 3. Apply the theme everywhere
Re-skin these to the unified tokens and the new header/footer chrome:
- `/register` (full data register) — same content and data rules, new skin, denser and cleaner card grid.
- `/widget` (widget builder), `/create`, `/my-pages`, `/p/$slug` (shared live pages).
- `/embed/$metric` keeps its own standalone light/dark switch driven by the existing `theme` URL option, unchanged for people who already embedded it.

### 4. Quality improvements
- Shared header and footer components so navigation is identical everywhere, with the current page highlighted and a working mobile menu.
- Consistent card, section heading and disclosure styling across pages; align register cards with the home page indicator cards.
- Loading skeletons instead of bare text while feeds are fetching, and a clear inline retry when a source is unreachable.
- Focus rings, keyboard-accessible disclosures, and contrast checked in both themes.
- Print styling kept working for shared pages.

## Not changing
- No data, source, or wording changes; every figure keeps its source, period, age and next release.
- No backend, database or schema changes.
- No route paths change.

## Technical notes
- `src/styles.css`: consolidate the `night-*` and light tokens into one semantic set defined on `:root` (dark) and `.light`/`:root:not(.dark)` as appropriate, registered once in `@theme inline`; remove the duplicate token families afterwards.
- Theme class applied to `<html>` from `src/routes/__root.tsx` with a small inline script for the pre-hydration read of `localStorage`.
- New `src/components/layout/SiteHeader.tsx`, `SiteFooter.tsx`, `ThemeToggle.tsx`; home and register import them instead of local nav markup.
- `src/components/home/NightPieces.tsx` renamed in spirit to shared indicator pieces and reused by `/register` so both pages share one card implementation.
- No changes to `src/lib/uk-stats*.ts` data logic.
