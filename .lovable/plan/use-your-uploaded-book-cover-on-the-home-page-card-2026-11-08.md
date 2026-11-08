# Use your uploaded book cover on the home page card

- Replace the current 3D book picture on "The Grooming Gang Cover-Up" card with the flat cover you uploaded (green cover with "No.1 bestseller").
- The picture stays clickable to Amazon UK; the buttons and wording stay the same.
- Store the upload as a site picture and remove the old one.

## Technical details
- `lovable-assets create` from the upload → new pointer; update import and width/height in IndependentWorksCta.tsx; delete old pointer with `lovable-assets delete`.
