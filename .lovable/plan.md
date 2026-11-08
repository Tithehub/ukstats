# Photos for every scandal

Give each of the 13 scandals its own picture, shown on the Scandals list cards and at the top of each scandal page.

## Where the pictures come from
- First choice: a freely licensed photo from Wikimedia Commons (e.g. the Post Office sign, Iraq war photos from the US military, Falklands archive photos, a Channel crossing photo from public authorities). Each shows a small credit line: photographer, licence, "via Wikimedia Commons".
- Pictures of living people named in sensitive scandals (Epstein, Clinton) are avoided; a place or document picture is used instead, so the image never implies wrongdoing.
- If no suitable free photo exists, the scandal's first official video thumbnail from YouTube is used, labelled with its channel.
- No photos are taken from news websites (copyright).

## What you'll see
- Scandals page: each card gets a wide picture across the top.
- Each scandal page: a large picture under the title, with the credit underneath.
- Shared links to a scandal page show that picture.

## Technical details
- Add `image: { src, alt, credit, licence, sourceUrl }` to each entry in scandals.data.ts; Commons files downloaded and stored as site assets (lovable-assets), each licence checked before adding.
- Fallback helper in scandals.ts picks first video thumbnail; test that every scandal resolves to an image with a credit.
- Render in scandals.tsx and scandals.$slug.tsx with lazy loading and fixed aspect ratio; og:image set in the scandal page head.
- Verify both pages in a test browser at desktop and phone sizes.
