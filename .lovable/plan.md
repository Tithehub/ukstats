# stats.solutions as the global door to UKStats

## My recommendation
Go with **two doors, one site** now, and leave a full rebrand for later. One site means one set of figures and one place to fix things, with no duplicate work. stats.solutions still gets its own world-first welcome and its own name at the top. If ukstats.co.uk ever has to go, stats.solutions is already complete and can become the only address in a day.

## What visitors will see
- **ukstats.co.uk**: no change. UK-first home page, UKStats name.
- **stats.solutions**: the same site, but:
  - the home page opens on the world view (countries, compare countries, gold, rest of the world), with the UK listed as one of the countries
  - the name at the top reads "Stats Solutions" and uses the same navy theme
  - page titles and share previews say Stats Solutions
- Links between the two work both ways ("UK figures" leads to ukstats.co.uk, "World figures" leads to stats.solutions).

## Google
- World and country pages (/countries, /fr, /us, /gold, /global, /compare-countries and so on) name stats.solutions as their main address. UK pages name ukstats.co.uk.
- Each address gets its own sitemap listing only its own pages, so Google never sees the same page twice.
- I'll walk you through adding stats.solutions to Google Search Console.

## Steps for you (domain bought elsewhere)
1. I'll show you a connect card for stats.solutions, with the exact records to add at your provider.
2. ukstats.co.uk is currently set as the **main** address, so every other address forwards to it. That would hide stats.solutions. In Project Settings, then Domains, then the ⋯ menu on ukstats.co.uk, choose **Unset as primary** so each address opens at its own name. I'll check the status once you've done it.
3. Say "publish".

## What stays the same
- The figures and sources, the honesty rules, sponsor rules, the funding pause and the legal notice are the same on both addresses.
- Sponsor banners follow the same region rules on both.

## Technical details
- New `src/lib/site-host.ts`: detects the brand ("uk" or "global") from the request host on the server (and from `window.location.host` once the page loads), and exports `SITES` with origin, name and slogan for each brand.
- Replace the hardcoded `https://ukstats.co.uk` canonicals and og:url values with a `canonicalFor(path)` helper. Country/world paths resolve to stats.solutions, all other paths to ukstats.co.uk. `SITE_ORIGIN` in share.ts becomes brand-aware.
- `index.tsx` loader returns the brand; the global brand renders a world-first hero (reusing the countries data) instead of the UK hero. This is server-rendered so the first paint matches and there's no hydration mismatch.
- The Wordmark in SiteHeader is brand-aware. The sitemap and robots.txt are generated per host.
- `DomainsPanel` `SITE_DOMAINS` gains stats.solutions and www.stats.solutions.
- Tests: a canonicalFor test (for example /fr resolves to stats.solutions and /register to ukstats.co.uk) and a host-to-brand test.
- AGENTS.md rule: brand comes from the request host, canonicals come from canonicalFor, and there is one codebase for both domains.
