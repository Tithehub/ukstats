# Put the sponsor system live on ukstats.co.uk

Publishing the sponsor work that is finished in the preview so businesses can see it, buy a plan, and appear on the site. The statistics themselves do not change.

## What goes live

1. **Sponsor banner** — the full-width picture banner with a button at the top of the footer on every page. It rotates three sponsors at a time every 8 seconds, holds still while a mouse is on it, and shows only sponsors from the visitor's own region. While there are no real sponsors it shows the made-up "Harbour & Hale Estate Agents" example, clearly labelled "Example sponsor".
2. **Our sponsors page** (`/sponsors`) — every approved sponsor in one place, grouped by region.
3. **Paid plans** (`/advertise`) — Supporter £5/month or £50/year, Sponsor £10/month or £100/year, with the "See what you get" example box. Real live payments are already connected, so money can be taken from the moment this is live.
4. **Footer and menu** — the "Supported by" line and the link to the sponsor page.

## Steps

1. A fresh security scan has just run: no issues found.
2. Publish the site to ukstats.co.uk.
3. After it deploys, check the live site: the banner appears at the bottom of the home page, `/sponsors` and `/advertise` both load, and the plans show as live (no "test mode" note).
4. Your real-money test, when you want to do it: sign in at ukstats.co.uk/advertise, pay £5 with a real card, fill in your name and link, approve it on your admin page, and check the "Supported by" line appears.

## Technical details

- Frontend (banner, pages, footer) goes live with this publish. The database and server pieces for sponsors are already deployed.
- The footer only shows a sponsor line when it is paid, approved, switched on, and from the same environment the visitor is on — so nothing from test mode can leak onto the live site.
- Sponsors appear only in the footer banner and on `/sponsors`. They never appear on figure cards, embeds, widgets, or share images, so paid placement stays away from the numbers.
- Nothing about the statistics, their sources, or their dates is touched by this publish.

## Not included

- Real sponsor photos — the example banner uses a stock dusk photo until a real sponsor uploads their own picture through the approval flow.
- Crypto addresses on `/support`, still waiting for you to send them.
- Reddit outreach and the release-day posts, which you send yourself.
