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

- Sponsors render only via SponsorStrip/SponsorBanner — the banner sits under the hero on the home page and in the footer zone on every other page — and /sponsors; region = page country code via regionFromPath, matched against the sponsor's chosen regions (groups expand in src/lib/sponsor-regions.ts; old single region column is a fallback) in footer/hub pages, never on figure cards, embeds, widgets or share images — keeps paid placement away from the numbers.
- Sponsor banner pictures live in the private sponsor-banners folder (or a pasted link we open and check), must be 3 wide to 1 tall and at least 1536×512, and are judged from the file bytes server-side before saving — so unapproved or wrongly shaped artwork never shows; the footer banner keeps one true 3:1 shape at every screen width so a sponsor's picture is never cropped.
- The home page's sponsor banner comes from the route loader via getSponsorBannerBoard (src/lib/banner.functions.ts) and is rendered with the page, never only by the page's interactive layer — that layer can fail to start on the live home page, and a sponsor's banner must show regardless.
- Sponsor self-service lives in a shared MySponsorship form used by /sponsor-dashboard and /advertise; authenticated server functions scope reads and changes to the caller's own sponsor row, including complimentary plans without subscriptions — keeps editing separate from buying a plan.


- Server functions must use method "POST", never "GET": GET server-function responses hang forever on the live edge runtime (POST reaches the handler fine), which left the home page frozen pre-hydration.
