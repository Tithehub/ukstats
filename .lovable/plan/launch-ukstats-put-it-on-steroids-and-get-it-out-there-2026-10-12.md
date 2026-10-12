# Launch UKStats: "put it on steroids and get it out there"

Builds on the marketing research and plan saved yesterday. The groundwork (credibility fixes, sourced posting agent, Google dataset markup, Bluesky/Mastodon, open-source repo) is done. What is missing is the actual launch: almost nobody outside knows the site exists.

## Ranked actions (fastest to bring visitors first)

1. **Launch-day pack, ready to send** — I write every message so you only paste and send:
   - Show HN post ("Show HN: Open-source register of official stats for 33 countries, every figure with its age and next release") — leads with the free API and GitHub, no donation mention (HN rules).
   - Pull request text for awesome-public-datasets (active, clear YAML process).
   - 5 short personal pitches: Full Fact, Paul Bradshaw, SA Mathieson (Making the Numbers), Simon Rogers, Royal Statistical Society / Significance.
   - Message to friends/contacts to share the site, with tagged links so we can see what worked.
2. **Release-day posting on Bluesky and Mastodon** — GDP 15 Oct, labour market 20 Oct, CPI 21 Oct: the agent drafts the figure within minutes of release; you approve. Plus a list of data journalists from the Bluesky starter packs to follow and reply to.
3. **"Share this figure" cards** — every figure gets a one-click shareable image (number, source, date) so anyone posting it spreads the link. This is the biggest multiplier I can build.
4. **Google Search Console** — connect it and submit the sitemap so Google indexes all 33 country pages and the dataset pages.
5. **Reddit, carefully** — answer r/ukpolitics questions with sourced figures (no launch posts; new-account link posts get removed); one original chart for r/dataisbeautiful.
6. **Later:** Google/Meta ads are possible but not first — the site is free and donation-funded, so earned attention fits better.

## What you do vs what I do
- I write all copy, build the share cards, wire the release-day drafts, update the saved marketing plan.
- You press send/post (I never post without your click), connect Search Console, and reply to people who answer.

## Technical details
- Share cards: server-rendered OG image route per metric (source + period + age printed on the image, no figure without a source), "Share" button on each card, `utm_source=<platform>&utm_medium=social` on shared links.
- Release-day drafts: extend the marketing agent to trigger on calendar release dates.
- Update /mnt/documents/marketing/plan.md statuses; add the launch pack as a file in Project Files.
