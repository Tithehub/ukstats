# UKStats full audit and improvement plan

## What the audit found

UKStats now has about 90 pages. The data rules are strong: real sources, dates, "Not published". The main risk is now **too much, poorly organised**. A first-time visitor can't tell in 5 seconds what the site is for or where to go.

Evidence from the current build:
- The menu lists about 45 links in three groups. "Explore statistics" alone has 22, mixing core stats with scandals, citizen journalists and politics terms.
- Several pages overlap: World rankings, Countries, Rest of the world, Compare figures, Compare countries and World compare. The old /new-home page still exists next to the real home page.
- The desktop bar's "World" button opens Countries, while the menu has a separate "World rankings" link.
- Tools that need an account (My pages, My branded stream, My sponsorship, Connect socials, Outreach) appear to every visitor.

## Priority 1: Navigation and clear journeys (biggest win)

1. Rebuild the menu around five sections: **UK Stats** (register, boats, crime, debt, education, spending, places), **World** (globe, rankings, compare, gold), **Investigations** (scandals, grooming inquiry, citizen journalists), **Learn** (politics explained, tax vs welfare, sources, calendar) and **Services** (reports, rent, sponsors, directory, widgets).
2. Show account tools only to signed-in users, under an "Account" menu next to sign-in.
3. Merge the overlapping world pages into one World hub with tabs. Old addresses will redirect to it, so shared links keep working.
4. Remove /new-home as a separate page and send it to "/".
5. Add a site-wide search box (Ctrl/⌘K on desktop, a search icon on phones) that finds figures, pages, schools, scandals and terms.
6. Add breadcrumbs and "Related" links at the bottom of each page so visitors move on instead of leaving. Current analytics show 1.16 pages per visit.

## Priority 2: Home page and first impression

1. The top of the page should answer three questions: what this is ("The UK's official numbers, sourced and dated"), what's new today, and where to start.
2. Keep the live stream, globe and Top figures, but load the globe and the YouTube player only when a visitor scrolls to them. This speeds up phones.
3. Use one clear main button (Explore UK stats) and one secondary button (Watch live). Paid services move lower down the page.
4. Add a "Today's changes" strip showing new releases since yesterday, using real release dates.

## Priority 3: Mobile and all devices

1. Check every main page on a phone (375px), tablet (768px) and desktop. Fix horizontal scrolling, wide tables (they become stacked cards on phones) and tap targets under 44px.
2. Add a fixed bottom bar on phones: Home, UK, World, Search, Live.
3. Adjust the size of the globe controls and the sponsor card on small screens so they never cover content.
4. Check the high-traffic pages first: /globe/broadcast, home, foreign aid, small boats and globe.

## Priority 4: Design consistency

1. Keep the navy, red and yellow look and the Archivo / IBM Plex Mono fonts. Make sure every page uses the same card, heading and source-label styles; older pages drift from this.
2. Use one standard "source strip" on every figure: source, period, age, next release and status colour.
3. Run an accessibility pass: colour contrast for yellow on white, focus outlines, labels for icon buttons and alt text for scandal photos.
4. Use the same empty, loading and error states everywhere.

## Priority 5: Speed and trust

1. Measure page speed on the main pages and cut heavy downloads (globe, camera list, satellites) from the first load.
2. Add a "How we verify" page linked from the footer, plus a corrections log. This builds trust with journalists.
3. Show a visible "last checked" time on live layers.
4. Fix the foreign-aid issues found earlier: next release date, the provisional label, an outdated link, keeping the last good figures, and missing percentages on the history page.

## Priority 6: Growth with no paid ads

1. Give every figure its own shareable link with a preview image. This is the main way pages get shared on social media.
2. Turn search rankings into a growth tool: write clear titles and short answer summaries, and add structured data (Dataset / FAQ) to stats and scandal pages.
3. Offer an optional free email "Weekly UK numbers" digest built from real releases. This needs your approval because it collects emails.

## Proposed order

```text
Phase A (now):   menu rebuild, merge world pages, remove new-home, search, phone bottom bar
Phase B:         home page rework, lazy-load heavy parts, mobile fixes on top pages
Phase C:         design consistency, accessibility, speed
Phase D:         trust pages, foreign-aid fixes, share links, SEO data
```

## Technical details

- Navigation: rewrite NAV_GROUPS and PRIMARY in SiteHeader.tsx. Hide account items using useAuth. Add a MobileTabBar in __root.
- Redirects: add beforeLoad redirects in the merged route files (countries, global, world-compare, compare-countries and new-home → the hub or "/"). Update the sitemap.
- Search: build a client index from the existing route list plus a lightweight server function (POST) over the cached payloads (register metrics, scandals, terms, schools by name).
- Lazy loading: use IntersectionObserver around GlobeExplorer and the YouTube iframe on "/".
- Verification: run Playwright screenshots at 375, 768 and 1280 widths for the top pages, plus a Lighthouse run before and after.
