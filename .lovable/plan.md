# Next search step: more clicks from existing Google views

Verification and the sitemap are done. Google has the new page list queued with no errors.

## Steps
1. **Foreign aid page** (1,273 views, 15 clicks): rewrite the title and description to match searches like "UK government foreign aid spending", using the real latest official figure year.
2. **Maps page** (778 views, average position 41): give it a clear title and description ("UK crime, migration and debt maps by area") and a short intro paragraph that describes what's on the map.
3. **House prices history** (921 views, 4 clicks): add the latest official figure and its date to the description.
4. **Recheck in 2 weeks:** read the Search Console numbers again and report the changes.

## Technical details
- Edit the `head()` meta for `foreign-aid.tsx` and `maps.tsx`, plus the history description builder. Descriptions show only published values and dates, never invented ones.
