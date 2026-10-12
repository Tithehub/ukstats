# Sponsor banner uploads, with a real size check

**Straight answer:** no, the size isn't checked yet. Today a sponsor pastes a web link and anything starting with `https://` is accepted — the form only *hints* at "1536×512 or 3:1 wide" in its label, and nothing verifies it. There's also no upload: nobody can choose a file from their device, and no picture storage exists on the site yet.

On top of that, the banner currently crops pictures: a 3:1 picture is shown inside a wider box on desktop, so the top and bottom of a sponsor's artwork get cut off.

## What to build

**1. A picture store for sponsors.** A public picture folder on the site's own storage, holding one file up to 2MB at a time.

**2. Upload from the sponsor's own form.** Sponsors choose a picture from their device. The size is checked twice: instantly in their browser for fast feedback, and again on the server so it can't be talked around.

**3. The rule — same as the banner we already use.** 3 wide to 1 tall, at least 1536×512 (the example estate-agent banner is exactly 1536×512). jpg, png or webp, under 2MB. A wrong picture gets a plain message instead of a silent crop, for example: *"That picture is 1200×800. We need a wide banner — 3 wide to 1 tall, at least 1536×512."*

**4. Pasting a link still works, but it gets checked.** If a sponsor's picture already lives elsewhere, they can paste the link — we download it, read its real size and apply the same rule before saving. Only `https://` addresses, 2MB cap, five-second timeout, and addresses that point inside our own network are refused.

**5. The whole picture on every device.** One true 3:1 shape everywhere, so nothing is ever cropped. On a phone the picture sits on top with the name, tagline and button in a panel below it (readable, not squashed over the image). On a larger screen the picture carries the words over a soft gradient, with the banner kept to a sensible height so the footer doesn't grow.

**6. Approval gets a picture.** Your admin list shows the actual banner next to each sponsor's name, so you see exactly what you're switching on. When a sponsor uploads a new picture, their old one is removed.

**7. Say the requirement up front.** The sponsor page states the size, shape, file types and limit before anyone starts, in the plan cards and the "See what you get" box.

## Technical details

- `src/lib/banner-image.ts` — small pure parser that reads the width, height and type straight from PNG, JPEG and WebP file bytes. No native image library, so it runs on the server platform this app deploys to.
- `src/lib/banner-upload.functions.ts` — signed-in-only server function: re-checks the bytes, uploads with the privileged client to `sponsor-banners/<user id>/…`, returns the public web address, and deletes the sponsor's previous picture when it belongs to them in that folder.
- `saveSponsorDetails` (`src/lib/sponsor.functions.ts`) — for pasted links: fetch, parse, apply the same shape and minimum-size rule before anything is saved.
- `src/components/sponsor/SponsorPlans.tsx` — file picker with a preview and the plain-language error text; the link field stays underneath as the alternative.
- `src/components/sponsor/SponsorBanner.tsx` — responsive 3:1 rendering, no cropping; rotation, region rules and the example sponsor stay exactly as they are.
- `src/components/agents/SponsorsPanel.tsx` — banner thumbnail per sponsor.
- Tests: `src/lib/banner-image.test.ts` covering real PNG/JPEG/WebP bytes (correct dimensions read back, a 3:1 picture accepted, a square or too-small one refused) and `src/lib/sponsor-banner-rule.test.ts` for the accept/reject rule itself; run with `bunx vitest run`. Existing sponsor visibility tests stay untouched.
- Picture folder created with the storage tool (public, 2MB per file), not with SQL.
- One line added to `AGENTS.md`: sponsor pictures are stored on our own storage or verified links, must be 3:1 and at least 1536×512, checked server-side before saving, and the banner renders at one true 3:1 shape at every screen width.

## Not doing

- We won't silently resize or crop a sponsor's artwork — a wrong picture is rejected with a clear message instead.
- Nothing changes about the figures, embeds, widgets or share images; sponsors stay in the footer zone only.

## Needs from you

Nothing to click. If the workspace refuses public picture folders, I'll tell you and keep the folder private with short-lived links instead.

Once it's built and tested, say "publish" and it goes to ukstats.co.uk.
