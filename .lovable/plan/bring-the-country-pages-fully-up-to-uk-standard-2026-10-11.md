# Bring the country pages fully up to UK standard

## Where things stand

The 33 country pages are built and working in the preview only — nothing new has gone live on ukstats.co.uk yet. Each country register carries Eurostat figures plus national feeds where they exist (US, Canada, Australia, and the European Central Bank rate for euro-area countries), and each has Explained, History, Calendar, Status and Sources views, an embeddable widget, open data endpoints, and a nightly check from the agent team.

Three things are waiting:

1. The new pages are not published.
2. Mastodon drafts (figure of the day, release-day posts) are sitting unposted in /agents.
3. Coverage is still thinner than the UK pages for several topics.

## Step 1 — Publish

Push the current preview to https://ukstats.co.uk so the country pages, embeds and open data endpoints are reachable by the public and by anyone the Marketing agent sends people to. The UK pages at "/" are untouched by this work.

## Step 2 — Post the waiting drafts

Once the site is live, approve and send the Mastodon drafts already in the queue, so the first country-era posts go out from @ukstats@mastodon.social. Bluesky stays as it is.

## Step 3 — Close the gaps against the UK pages

The UK register has topics the country pages do not yet carry. For each one, the plan is: find whether the country's own official body publishes a machine-readable feed, wire in the ones that do, and leave the rest showing "No live feed" with the official link. Nothing is estimated or filled in.

In order of value:

- **Government debt in money, not just percent of GDP** — the UK shows total debt to the penny; countries currently show a percentage. National debt offices publish totals for most of these countries.
- **Central bank rates** — only euro-area countries have one. National banks (Banque de France does not set it, but Banque de France publishes the French rate via the ECB; Poland, Sweden, Norway, Switzerland, Denmark, Hungary, Czechia, Romania and Bulgaria all publish their own) need their own feeds.
- **Recorded crime** — currently Eurostat's homicide series only. Several national police agencies publish fuller crime counts.
- **Weather, daily and historic, plus alerts** — the UK has this; no country page does.
- **Polling** — the UK names individual pollsters; countries have nothing.
- **Immigration costs and release dates** — the UK names a next release date; countries say "Per Eurostat release calendar".

## Step 4 — Point the overnight agents at the new countries

The nightly run already checks every country feed and logs outages. Extend it the same way the UK team works: detect revisions to a country figure, draft Explained pages for country metrics, and let the Marketing agent post country figures of the day alongside UK ones. Drafts still need your approval before anything is posted.

## Technical notes

- Publish: preview_ui--publish against the existing custom domain (ukstats.co.uk). No database changes needed — the country work is code plus public API routes only.
- Posting: approve the pending rows in agent_posts and call the existing social-post path for mastodon, as done for the first Bluesky post.
- New feeds land in src/lib/national.server.ts (fetchers, server-only) with pure parsers in src/lib/national.ts, following the existing pattern; any failure returns "no figure", never a guess.
- Country pages read from src/lib/countries.server.ts, which merges national feeds first, then Eurostat, then explicit gap cards from src/lib/country-detail.ts.
- Agents: src/lib/agents/countries.server.ts (countryWatchdog) is the hook for revision detection and country explainer drafts; src/lib/agents/marketing.ts picks the figure of the day.
- Safety note carried over from earlier: the Mastodon token and Bluesky app password were pasted into chat, so revoke both and reconnect fresh ones through /connections when convenient.
