# Earning money from UKStats while the stats stay free

The figures stay free, open and ad-free. Trust is the product: if a business could pay to sit beside a crime or migration number, people would stop trusting the number. So we earn money around the stats, not inside them.

## What I recommend (in this order)

1. **Sponsor slots for businesses (the "advertising space" you asked for)**
   - One clearly labelled "Supported by" strip in the footer and on the /support page, plus one sponsor card on topic hub pages (e.g. house prices, interest rates). Never placed on a figure card, an embed widget or a share image.
   - Monthly flat fee, first-come. Text and logo only, no tracking scripts, no pop-ups.
   - Rules page: no political parties, campaign groups, gambling or payday lenders; a sponsor never sees or influences figures; we can end a sponsorship at any time.
   - New page /advertise with what's on offer, the rules and an enquiry form (goes to the admin inbox in /agents). Prices are left blank until you give them — I won't invent them.

2. **Paid API and embed plans for organisations**
   - Free API stays as it is for individuals.
   - Paid "Pro" key for companies, newsrooms and apps: higher limits, guaranteed uptime note, bulk download, white-label embeds (no UKStats badge). Billing through a payment provider once you choose one.

3. **Weekly "Release day" email briefing**
   - Free email each week listing what was published and what changed, one sponsor line at the bottom. Builds an audience we own and gives sponsors a second place to appear.

4. **Keep donations** (already on /support) and add the crypto addresses once you send them.

## Marketing to sell the sponsor slots
- Add "Sponsor UKStats" link to the footer and the launch-pack outreach.
- Draft a short message to 10 likely sponsors (data tools, estate-agent software, fintech, research firms) for you to send personally.
- Continue the open marketing steps already planned: release-day posts on 15/20/21 Oct and the Reddit [OC] chart.

## What I need from you
- Monthly sponsor price (or leave "contact us").
- Which payment provider is fine (Stripe or Paddle) — only needed for step 2.
- Any businesses you already know who might sponsor.

## Technical details
- New route src/routes/advertise.tsx (head metadata, sitemap entry), sponsor data in a small table `sponsors` (name, logo, url, placement, active, starts/ends) readable by everyone, writable by admin only; enquiries table writable by anyone, readable by admin.
- `<SponsorStrip>` component rendered in footer and hub pages only; explicitly excluded from embed, widget and OG routes.
- Paid API keys and email briefing are later phases, each planned separately.
- Add the monetisation task to roadmap.md; record "sponsors never adjacent to figures" as a project rule.
