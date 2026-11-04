# Free-to-use video clips on the live stream

Add a small video box to the stream's side panel. It plays short clips that are free to reuse and that match the current segment and country. Every clip shows its source, date and licence. Clips from news outlets (BBC, Sky, GB News and others) are never used: YouTube would strike or block the stream.

## Clip sources
1. **US government (public domain):** DVIDS (US military), NASA, White House, and US Customs and Border Protection footage. Labelled with the agency's name, for example "US Department of Defense — public domain".
2. **Wikimedia Commons:** openly licensed video files (CC0, CC BY and CC BY-SA), each shown with the creator and licence. Any other licence is skipped.
3. **UK Parliament & No.10:** included only after each clip's reuse terms have been checked. Before going live, the clip list will record which terms each clip was checked against. A clip with unclear terms is left out.
4. **Paid news licence (Reuters/AP):** not built yet. A switched-off slot waits for the payment hold to end, so these can be added later without rebuilding.

## How clips are matched
- A checked list of clips. Each clip has its source page, licence, credit, date, length, topic and country.
- Topics match the stream's segments: economy and Parliament, small boats and borders, defence and security, world warnings by country, and flights.
- If the current segment has no matching clip, the box shows a still card saying "No licensed clip for this topic". It never fills the gap with an unrelated clip.
- Clips play muted, one at a time, inside the side panel above "Up next". Each shows a caption: "Footage: [credit] · [licence] · [date] — not UKStats data".
- Footage is kept apart from the figures and is never presented as evidence for a figure.

## Before anything goes live
- Every clip is opened and checked against its licence page. The date it was checked is stored with the clip.
- Clips are saved to the site's file storage, so the stream never depends on a third-party video player.

## Technical details
- `src/lib/stream-clips.data.ts`: a dated, verified list of clips (`id, url, sourcePage, licence, credit, published, topic[], country, checkedAt`). Licence names come from a fixed allow-list.
- `src/lib/stream-clips.ts`: pure `clipFor(segment)` matching and a licence allow-list guard, with tests. The tests cover: news-outlet clips rejected, unknown licences rejected, and no substitute clip when nothing matches.
- A `StreamClip` box in `globe_.broadcast.tsx` (muted `<video>`, autoplay, loops through the segment's clips). The studio preview shows it automatically.
- A licensed-news slot behind the funding-hold flag, switched off.
- A new rule in AGENTS.md.
- Check at 1920×1080: the clip changes with the segment and the caption is visible.
