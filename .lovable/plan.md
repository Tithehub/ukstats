# Scandals section

A new **Scandals** page (/scandals) with one page per scandal (/scandals/post-office-horizon etc.), linked from the main menu, topic bar, home page and footer.

## What each scandal page shows
1. **What happened** — a short neutral summary written from the official documents, dated.
2. **Official record** — inquiries, court rulings, government reports, Parliament (Hansard, committee reports), declassified files, each with publisher, title, date and link. Checked before adding.
3. **Status** — e.g. "Inquiry ongoing", "Final report published 2025-…", "Files partly released". Unknown stays "Not published".
4. **Main headlines** — links to major news stories (BBC, Reuters, Sky, Telegraph, GB News etc.), titles word for word, labelled **News — not an official source**.
5. **Videos** — links to YouTube videos from verified channels only (official bodies first, then broadcasters), with the original thumbnail, labelled the same way. No clips are copied or played on the site (copyright).
6. Where the site already has figures (small boats, grooming gangs), a link to those pages — no new figures are invented.

## The scandals (first set)
- Grooming gangs (links to your existing inquiry page)
- Post Office Horizon (statutory inquiry, compensation schemes)
- Epstein files (US court unsealings, US DOJ/House Oversight releases)
- Jimmy Savile (BBC Dame Janet Smith review, NHS/DoH investigations)
- BBC Panorama Trump edit (BBC statements, Culture Committee, Ofcom)
- Princess Diana (Operation Paget, 2008 inquest verdict)
- COVID and vaccines (UK Covid-19 Inquiry modules, MHRA safety reports, Vaccine Damage Payment Scheme)
- UFOs / disclosure (MoD UFO files at National Archives, US AARO and Congress hearings)
- Iraq war (Chilcot Inquiry)
- Iran war (UK and US government statements, Parliament briefings, travel advice)
- Falklands (Franks Report, National Archives releases)
- Bill Clinton (Starr Report, impeachment records, Epstein-related court documents)
- UK boat crossings (Home Office figures already on the site, NAO and committee reports)

## Rules kept
- Only official documents count as the record; news, YouTube and independent works are clearly labelled and never used as sources of fact or figures.
- Claims are worded as "X was alleged / found / ruled by [body] on [date]", never as our own conclusion — keeps the site legally safe on named living people.
- Every link and date checked when added; a "Links checked on" date shows.

## Technical details
- Dated snapshot data in src/lib/scandals.data.ts (typed: summary, status, official sources, headlines, videos), read via src/lib/scandals.ts; pure helpers with tests (official vs news split, sort by date).
- Routes: src/routes/scandals.tsx (index grid, search) and src/routes/scandals.$slug.tsx with per-page head() metadata and OG share card; added to sitemap.
- YouTube links verified with yt-dlp; thumbnails use YouTube's CDN URL.
- Research done by parallel helpers per scandal; any link that fails is left out.
