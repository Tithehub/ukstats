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
- Publication dates are rendered by fmtDate in src/lib/uk-stats.ts, which pins Europe/London; never format a date with the visitor's own clock zone — server and browser must print the same day or React discards the server-rendered page.
- Official-publisher directory lives in src/lib/agencies.data.ts (links checked before adding) and is read only through src/lib/agencies.ts; "live" status is derived from the country's current metric source hosts — so the directory never claims a feed we don't actually pull.
- Gold reserves come only from the IMF IRFCL combined sector (S1XS1311); filings above an implausibility ceiling are shown as filed but never ranked — we flag source errors rather than correcting them.

- Sponsors render only via src/components/SponsorStrip.tsx in footer/hub pages, never on figure cards, embeds, widgets or share images — keeps paid placement away from the numbers.
