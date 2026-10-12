# Redo the share cards to match the site theme

## Problem
The four share images (home, gold, sources, countries) use cream/amber type and a generic look. The site's real identity is: deep blue "night" background, electric-blue accent, Archivo headlines, IBM Plex Mono small labels, and the fresh/ageing/overdue status colours (green, amber, red).

## Fix
Regenerate the same four 1200x630 cards with the site's actual visual language:

- Background: the site's deep blue night tone with a slightly lighter blue panel, not generic navy
- Accent: electric blue (the site's link/highlight colour) instead of amber
- Type: clean grotesque headline (Archivo-style), small monospace label (IBM Plex Mono style)
- Motif: a thin status strip using the green/amber/red "data freshness" colours — the site's signature idea
- Keep each card's existing wording and subject (home, gold, sources, countries)

Then publish so the new cards reach ukstats.co.uk (the earlier publish of the current cards was cancelled before it ran, so nothing has gone live with the off-theme images).

## Technical details
- Overwrite public/og/home.jpg, gold.jpg, sources.jpg, countries.jpg via the image editor using the existing cards as the base.
- No code changes needed — the og:image tags already point at those paths.
- One publish at the end ships both the waiting pages (gold, sources, flags) and the corrected cards.
