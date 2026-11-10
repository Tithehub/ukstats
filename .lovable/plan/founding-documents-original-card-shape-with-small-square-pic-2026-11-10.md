# Founding documents: original card shape with small square pictures

## What you'll see
- The four cards go back to the shape they had before: short and compact, sitting four across on desktop and two across on tablet.
- Each card gets a small square picture (about 56×56) on the left, with the title, short note and link icon to its right.
- The image credit moves into small text below the note so the card stays short. It still links to the source.
- Claim of Right 1689 has no usable picture, so it gets a small navy square with "1689" in place of a photo.
- On phones the cards stack one per row in the same compact style.

## Technical details
- In `FoundingDocuments.tsx`, change each card to `flex items-start gap-3 p-3` with `<img class="size-14 rounded object-cover shrink-0">`, and remove the 4:3 image block.
- Keep the existing pictures, which are 800×600 and crop to a square through object-cover.
- Check the layout with desktop and phone screenshots. Nothing gets published.
