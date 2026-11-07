# Get UKStats indexing fully corrected

## What Google says today
- ukstats.co.uk is **Submitted and indexed**, crawl allowed, and the canonical is correct (last crawled 1 Nov).
- Last 28 days: 15,240 impressions and 137 clicks, average position 24.6. The top pages are the welfare bill, foreign aid and house price history pages.
- The file you uploaded is Google's ownership check file, which Google uses to verify a new property (probably stats.solutions or www).

## Steps
1. **Publish Google's verification file** at `/google523b12971e53315b.html` on every domain, exactly as Google supplied it, so verification passes on ukstats.co.uk, www and stats.solutions.
2. **Sitemap audit:** make sure every public page appears in the sitemap for each domain, including the newer pages: Reports, Rent, Spending and its 24 categories, the grooming gangs inquiry, Live, Globe, Preparedness and the history/explained pages. Leave out preview-only pages and pages marked noindex (dashboards, studio, broadcast).
3. **robots and canonical check:** confirm that robots allows crawling and points to the right sitemap per domain, that www and stats.solutions pages point to the right main address, and that no live page is accidentally marked noindex.
4. **Search Console:** after publishing, you click Verify in Search Console. I then submit the sitemap for the new property and check its indexing status.
5. **Quick wins:** improve titles and descriptions on the high-impression, low-click pages (house prices: 921 impressions, 4 clicks; foreign aid; maps) so more people click through.

## Technical details
- Add a server route `src/routes/google523b12971e53315b[.]html.ts` that returns the exact file text as `text/plain`, or a static copy in `public/`.
- Review `src/routes/sitemap[.]xml.ts` and `robots[.]txt.ts` against the route list and `site-host.ts`.
- Use the `head()` meta on the affected history, foreign-aid and maps routes.
