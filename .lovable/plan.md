# Add document images to "Our founding documents"

## What you'll see
Each of the four cards on the home page (Bill of Rights 1689, Magna Carta 1297, Claim of Right 1689, Act of Settlement 1701) gets an image of the real original document at the top. The image keeps its existing official link and has a small credit line underneath (for example "Original parchment · Parliamentary Archives").

## Where the images come from
- legislation.gov.uk does not publish thumbnails, so each image will be a photo of the original manuscript from the body that holds it (Parliamentary Archives, National Records of Scotland, The National Archives, or a public-domain scan on Wikimedia Commons).
- Before I use an image I check its licence. I only use images that are public domain or openly licensed, and I credit each one.
- If I can't find a usable original for a document, that card shows a plain navy panel with the title. I won't put a lookalike or AI-made image in its place.
- Images are hosted on our own fast storage, cropped to a uniform 4:3 size, and lazy-loaded so the home page doesn't slow down.

## Later (not part of this change)
- History and a record of changes for each document. A change is only described as unlawful where a court ruling or official source says so, and that source is quoted and linked. I'll save this rule now so it holds later.

## Technical details
- Download originals to /tmp, resize to 800×600 JPG, upload via lovable-assets, import the `.asset.json` pointers in `FoundingDocuments.tsx`.
- Add `image`, `alt`, `credit`, `creditHref` fields to DOCS; `loading="lazy"`, explicit width/height.
- Check the layout on phone and desktop with screenshots. Nothing gets published.
