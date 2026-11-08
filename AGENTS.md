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

- Overnight agent team lives in src/lib/agents/ (server-only), triggered by /api/public/agents-tick via pg_cron; agents write only findings/drafts/revisions, never figures — keeps the no-fabrication rule enforceable. Details in src/lib/agents/AGENTS.md.
- Non-UK countries live under /$country (registry in src/lib/countries.ts, Eurostat parser in src/lib/eurostat.ts); UK register at "/" is untouched — keeps the proven UK pipeline isolated from new sources.
- National (non-Eurostat) sources live in src/lib/national.server.ts with pure parsers in src/lib/national.ts — keeps network code server-only and parsers testable.
- A national figure assembled from several regional feeds is all-or-nothing: if any region fails to answer, show no figure rather than a partial count — a shorter total would be read as the country's real number.
- Render publication dates via fmtDate (Europe/London), never the visitor's zone — prevents hydration mismatches.
- Official-publisher directory lives in src/lib/agencies.data.ts (links checked before adding) and is read only through src/lib/agencies.ts; "live" status is derived from the country's current metric source hosts — so the directory never claims a feed we don't actually pull.
- Gold reserves come only from the IMF IRFCL combined sector (S1XS1311); filings above an implausibility ceiling are shown as filed but never ranked — we flag source errors rather than correcting them.

- Independent dedications render through RestoreDedication at the bottom of SiteFooter, separate from sponsor records and never in embeds, widgets or share images — keeps attribution distinct from paid placements and statistics.

- Server functions must use method "POST", never "GET": GET server-function responses hang forever on the live edge runtime (POST reaches the handler fine), which left the home page frozen pre-hydration.
- Read the stored payload (payload_cache: uk-stats, country-<code>) before collecting from publishers and serve lastGood during refresh; cold requests never wait on publishers when a snapshot exists.
- Request-pool helpers hold slots through body consumption (Eurostat: four slots); cancel failed or unused responses.
- Register search and category filters live in URL search parameters and use the shared stat-search matcher; this keeps results shareable and browser Back restores the selection.
- Use PageFeedback for shared loading and recoverable data errors and keep automatic link preloading disabled; this gives explicit feedback without fetching large data collections for incidental pointer movement.
- Router dehydrate/hydrate serializes the successful Query cache per request; data pages must not re-download loader results before their controls can become interactive.
- Funding availability lives in src/lib/funding-policy.ts as separate sponsorship and donation flags; the donations notice renders via FundingLegalNotice.tsx — so either can pause or resume independently; retain donation config so the pause is reversible.
- City crime ranks use city-crime pure parsers and a POST server wrapper with official-source adapters; latest-year missing/suppressed cells block rankings, national/provincial totals and overlapping subareas are excluded, and unavailable countries never substitute regional or perception data.
- Brand comes from the request host via src/lib/site-host.ts (stats.solutions = world-first, everything else UK); canonicals for world/country paths use stats.solutions, sitemap and robots are generated per host — one codebase serves both domains.

- Read any subdirectory AGENTS.md (sponsor/, stream/) before editing there.
- World rankings use only World Bank WDI, cached as payload_cache "world-bank-v2"; figures more than 3 years behind the newest are unranked — keeps stale filings from skewing ranks.
- Party comparisons use sourced election records and dated manifesto summaries in party-comparison.data.ts; pure helpers preserve ties and show polls individually, excluding devolved-party shares from GB headline ranks — avoids treating promises or estimates as outcomes.
- World comparisons reuse the cached WDI payload and flag missing, stale and different-year filings; answer topics require reader/search evidence and reuse register values — avoids new figures or false equivalence.
- UKHSA uses its documented dashboard alerts proxy: two attempts per URL, complete nine-region coverage, refresh within 24h and valid periods; never prose or expired records. Non-publication decisions retain original dates during outages — avoids assumed alerts.
- Maps and tax/welfare loaders use shared Query options; the router reuses recent loader results for one minute — avoids repeated network work while preserving published source dates.
- Small-boats year comparisons use completeBoatWindow/compareBoatYears; equal calendar cutoffs require unique complete daily coverage, and product comparisons cite dated public listings — avoids partial totals and unsupported competitor claims.
- UkTopicNav is shared by the UK home and register; ShareRow reports clipboard success only after the write resolves — keeps topic journeys and sharing feedback consistent.
- Restore Britain media uses a dated verified-channel/publisher snapshot with CDN-hosted original thumbnails, separate from statistical feeds; preserve unknown dates and archive limits rather than infer metadata.
- Preparedness official-source advice remains a dated verbatim snapshot in src/lib/preparedness.data.ts; original UKStats summaries are separately labelled, and the proposed catalogue lives in preparedness-products.ts without inventory or checkout — keeps source attribution and unconfirmed retail claims distinct.
- Third-party preparedness kits use a separate dated supplier directory in preparedness-suppliers.ts and PreparednessSupplierLinks; clean direct links never share UKStats checkout or imply product tests, endorsement or commission — keeps public-service links distinct from the paused proposed catalogue.
- The /globe unrest layer uses only UK FCDO and US State Dept advice (pure parsers in src/lib/unrest.ts, cached as payload_cache "unrest-v1") plus an optional ACLED layer labelled as research; a hotspot appears only when a publisher's own words mention unrest within 30 days — never inferred from news.
- The globe and its country control panel live in src/components/globe/GlobeExplorer.tsx, shared by "/" and /globe; country buttons come only from countryDestinations in src/lib/globe-destinations.ts — so the globe never links a page a country does not have.
- Globe riot/protest markers come only from unrestMarkers over official warnings, placed on places named in the advice (Natural Earth gazetteer in src/lib/unrest-places.data.ts) or the capital flagged "location not specified" — never from news.
- Globe travel-advice layers show each government's own scale (State Dept Level 1–4, FCDO alert_status read in batches of 40 country pages per refresh into payload_cache "unrest-v1".fcdoAlerts) and never merge them; unchecked countries stay grey — keeps edge subrequests bounded and avoids implied equivalence.
- Globe broadcast channels are a dated snapshot in src/lib/broadcast-channels.data.ts: only YouTube-verified channels (checked with yt-dlp), grouped official / MSM / alternative with state-owned flagged and original YouTube CDN avatars; only government channels are labelled official — keeps media separate from official sources.
- Globe live feed (src/lib/video-feed*.ts, payload_cache "video-feed-v1") lists only uploads from channels in broadcast-channels.data.ts, titles verbatim, using YOUTUBE_API_KEY when set else channel RSS; it never creates warnings or figures — keeps media separate from official sources.
- Globe flights (src/lib/flights*.ts, payload_cache "flights-v1", 60s TTL) use OpenSky's global feed, else adsb.lol busy-region tiles plus worldwide emergency squawks, labelled as not official; colours come only from squawk 7500/7600/7700 and the UK/US advice for the country under the plane — never inferred routes or destinations.
- GlobeExplorer preloads the EarthGlobe module before enabling WebGL rendering — a lazy swap that suspends during a pending navigation left the globe blank on shared links.
- Floating globe news screens (NewsScreens.tsx, pure layout in src/lib/news-screens.ts) reuse BroadcastPanel and shared queries, are stored per device in localStorage and read after hydration — extra screens add no network work or hydration mismatches.
- Globe migration layer (src/lib/migration-flows*.ts, payload_cache "migration-flows-v1", 24h TTL) uses only Home Office small boats, Frontex illegal-crossing detections, US CBP southwest encounters and UNHCR refugee stocks; sources are shown side by side, never summed, and UNHCR is labelled as not illegal crossings — avoids a fabricated worldwide total.
- Globe news & police reports layer (src/lib/news-reports*.ts, payload_cache "news-reports-v1", 10min TTL) shows publisher headlines verbatim, labelled news or police notice, as research-style markers separate from official warnings — never creates warnings or figures.
- Stream running order (stream-rundown.ts) uses only published metrics, official warnings and existing headlines; stream-schedule.ts drives it from the London clock (even hours UK, odd hours other countries) so reloads land on the same slot.
- Stream footage: only licence-checked clips in stream-clips.data.ts filtered by clipAllowed; news-outlet footage rejected — avoids copyright strikes.
- /globe/broadcast is a fixed 1920×1080 frame scaled to the window; GlobeExplorer broadcast mode hides panels; [data-fit] overflow reports to /globe/studio.
- Grooming inquiry page: dated official snapshot in grooming-inquiry.data.ts; report estimates labelled, national counts "Not published".
- Stream cameras: only public-authority open feeds in stream-cameras.data.ts with live: true (continuous video; TfL JamCams are loops, so off), labelled "scene only" — no private/police CCTV.
- Spending: councils link only their own nation's return, never summed.
- Stream AI presenter: says only scriptForCard text, labelled AI; ?voice=off mutes.
- Share pictures are rendered by /api/public/og/$key (pure-JS rasteriser in og-render.server.ts, text rules in og-card.ts) from published snapshots only; route heads add them via ogImageMeta — no native image libraries run on the edge.
