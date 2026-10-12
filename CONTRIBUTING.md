# Contributing to UKStats

Thank you — the whole point of open sourcing UKStats is so more eyes keep it honest.

## The one rule that matters

**Never invent, estimate, extrapolate or interpolate a figure.** Every number on the site must come from an official, machine-readable source and display its publisher, reference period and a source link. If a country or topic has no usable feed, the correct contribution is a clearly labelled "no live feed" state — not a number.

## Ways to help

- **Data corrections** — if a figure looks wrong, open an issue with the publisher's own number and a link. We check against the source, never against memory.
- **New sources** — know an official feed we don't use (a national statistics office, a police open-data portal)? Suggest it with the "New source" issue template.
- **New countries or metrics** — see below.
- **Code** — bug fixes, accessibility, performance, tests.

## Adding a metric or country

1. Parsers must be pure functions in `src/lib/` (e.g. `eurostat.ts`, `national.ts`) with tests. Network calls live only in `*.server.ts` files.
2. Every metric carries: title, value, unit, reference period, source name, source URL, and next-release date where published.
3. On failure, return an explicit unavailable/no-feed state. Never fall back to a cached or guessed number without labelling it.
4. Dates are rendered with `fmtDate` in `src/lib/uk-stats.ts` (pinned to Europe/London) — never format dates with the visitor's clock zone, or SSR hydration breaks.

## Before you submit

```sh
npm test            # all parser and rule tests must pass
npm run typecheck   # typecheck must be clean
```

## What the agents do (and don't)

The nightly agent team (`src/lib/agents/`) writes findings, drafts and revision notes only. Agents never change figures and never change code — a human approves everything. Please keep it that way.

## Code of conduct

Be decent. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
