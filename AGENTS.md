<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Overnight agent team lives in src/lib/agents/ (server-only), triggered by /api/public/agents-tick via pg_cron; agents write only findings/drafts/revisions, never figures — keeps the no-fabrication rule enforceable.
- Non-UK countries live under /$country (registry in src/lib/countries.ts, Eurostat parser in src/lib/eurostat.ts); UK register at "/" is untouched — keeps the proven UK pipeline isolated from new sources.
- National (non-Eurostat) sources live in src/lib/national.server.ts with pure parsers in src/lib/national.ts — keeps network code server-only and parsers testable.
- A national figure assembled from several regional feeds is all-or-nothing: if any region fails to answer, show no figure rather than a partial count — a shorter total would be read as the country's real number.
- Render publication dates via fmtDate (Europe/London), never the visitor's zone — prevents hydration mismatches.
- Official-publisher directory lives in src/lib/agencies.data.ts (links checked before adding) and is read only through src/lib/agencies.ts; "live" status is derived from the country's current metric source hosts — so the directory never claims a feed we don't actually pull.
- Gold reserves come only from the IMF IRFCL combined sector (S1XS1311); filings above an implausibility ceiling are shown as filed but never ranked — we flag source errors rather than correcting them.

- Sponsors render only via SponsorStrip/SponsorBanner — the banner sits under the hero on the home page and in the footer zone on every other page — and /sponsors; region = page country code via regionFromPath, matched against the sponsor's chosen regions (groups expand in src/lib/sponsor-regions.ts; old single region column is a fallback) in footer/hub pages, never on figure cards, embeds, widgets or share images — keeps paid placement away from the numbers.
- Independent dedications render through RestoreDedication at the bottom of SiteFooter, separate from sponsor records and never in embeds, widgets or share images — keeps attribution distinct from paid placements and statistics.
- The home page's sponsor banner comes from the route loader via getSponsorBannerBoard (src/lib/banner.functions.ts) and is rendered with the page, never only by the page's interactive layer — that layer can fail to start on the live home page, and a sponsor's banner must show regardless.


- Server functions must use method "POST", never "GET": GET server-function responses hang forever on the live edge runtime (POST reaches the handler fine), which left the home page frozen pre-hydration.
- Read the stored payload (payload_cache: uk-stats, country-<code>) before collecting from publishers and serve lastGood during refresh; cold requests never wait on publishers when a snapshot exists.
- Request-pool helpers hold slots through body consumption (Eurostat: four slots); cancel failed or unused responses.
- Register search and category filters live in URL search parameters and use the shared stat-search matcher; this keeps results shareable and browser Back restores the selection.
- Use PageFeedback for shared loading and recoverable data errors and keep automatic link preloading disabled; this gives explicit feedback without fetching large data collections for incidental pointer movement.
- Router dehydrate/hydrate serializes the successful Query cache per request; data pages must not re-download loader results before their controls can become interactive.
- Public sponsor displays read only payments-env, never the Stripe SDK; this prevents payment scripts from loading on statistics-only pages.
- Funding availability and the legal hold statement live in src/lib/funding-policy.ts and render via FundingLegalNotice.tsx, so one flag pauses or resumes both; retain checkout and subscription setup so the pause is reversible.
- City crime ranks use city-crime pure parsers and a POST server wrapper with official-source adapters; latest-year missing/suppressed cells block rankings, national/provincial totals and overlapping subareas are excluded, and unavailable countries never substitute regional or perception data.
- Brand comes from the request host via src/lib/site-host.ts (stats.solutions = world-first, everything else UK); canonicals for world/country paths use stats.solutions, sitemap and robots are generated per host — one codebase serves both domains.

- Subdirectories may have their own AGENTS.md (e.g. src/components/sponsor/); read it before changing files there.
- World rankings (/world, /world/$iso) come only from World Bank WDI via src/lib/world.server.ts, cached as payload_cache "world-bank"; figures more than 3 years behind the newest are listed but unranked — keeps stale filings from skewing ranks.
- Party comparisons use sourced election records and dated manifesto summaries in party-comparison.data.ts; pure helpers preserve ties and show polls individually, excluding devolved-party shares from GB headline ranks — avoids treating promises or estimates as outcomes.
