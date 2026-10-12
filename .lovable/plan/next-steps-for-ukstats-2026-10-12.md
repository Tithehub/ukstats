# Next steps for UKStats

## 1. Publish the waiting pages
The gold reserves page (80 countries, with flags), the 33-country official sources directory, and per-country sources pages are built and tested but only in preview. Publish them so they are live on ukstats.co.uk.

## 2. Shareable images per figure
When a UKStats link is shared on Bluesky, Mastodon, WhatsApp or Reddit, it currently shows a plain card. Add a per-metric share image so each shared link shows the actual figure, its source and its date — this is what makes posts travel. Uses the existing ShareRow component.

## 3. Reddit outreach
One original-chart post for r/dataisbeautiful and sourced replies in relevant communities, following the launch pack already saved in Project Files. Marco sends these himself; drafts prepared here.

## 4. Release-day posts
Approve the agent-drafted posts in /agents on the planned dates (15/20/21 Oct) so the announcement series goes out on Bluesky and Mastodon.

## Technical details
- Publish step uses the standard publish flow; no code changes needed.
- Share images: an OG image route that renders figure + source + reference period as a 1200x630 image, wired into each page's head metadata.
- No new data sources; no fabricated figures; all-or-nothing national counts rule unchanged.
