# Broadcast-quality sponsor pictures for the live stream

The current pictures look cut-and-pasted: flat colour fills, visible rectangles around logos and products, and too much empty space. They are being rebuilt as proper full-scene pictures, one consistent house style for all five.

## The look
- **Full scene, edge to edge:** each sponsor's own banner scene is extended to fill the whole 1200 x 900 frame (more sky and sea around the yacht, more purple lightning and reflection around the card pack, more soft studio backdrop behind the phone, coin and chip grid). No boxes, no seams, no flat fills.
- **Real artwork kept exact:** after the scene is extended, the sponsor's own product and logo are put back from their original banner pixel-for-pixel. They're only scaled evenly, so nothing is redrawn, retyped, stretched or cut off. The whole yacht, phone, card pack, coin and chip grid show.
- **Same layout for every sponsor:**
  - Logo top-right.
  - Product large in the centre-right.
  - Left side calm and darker for the title and QR.
  - Far right clear of the presenter.
- **Finish:** gentle matching light, a soft contact shadow under each product and the same margins on every picture, so the five look like one professional set.
- **Light banners** (GoPharma, gold.live) get a deeper studio tone so they sit properly in the navy broadcast and don't flash white on air.

## How it is checked
1. Each picture is opened at full size: the logo reads clearly, the product is whole, there are no edges or halos, and nothing is distorted.
2. Each picture is shown inside an exact copy of the stream's sponsor box (angle, title, QR, "Scan to discover more", presenter edge), so you see it as viewers will.
3. You'll get one sheet showing all five in the box. Anything that isn't right is fixed before I show you.

## Delivery
- New `_v4` files in Files (earlier versions kept), swapped into the stream box.
- Nothing is published until you approve them.

## Technical notes
- Scene extension uses the image editor with each banner as the only input and a prompt forbidding new objects or text. The original product and logo are then pasted back from the banner with PIL, using even scaling and a feathered mask on the extended scene, so the brand artwork is untouched.
- The in-box preview is rendered in Playwright from a standalone copy of the Orbit sponsor card markup and styles, not the live page.
