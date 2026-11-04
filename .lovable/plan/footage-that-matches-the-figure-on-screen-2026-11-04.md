# Footage that matches the figure on screen

## What changes
1. **Find 2026 footage for every topic.** Search Wikimedia Commons (filmed 2026, open licence), DVIDS (US government, public domain) and UK government footage released under the Open Government Licence. Target 2–4 clips each for: small boats / Channel / Border Force, legal migration (airports, ports), economy (City, Bank of England, shops), cost of living (supermarkets, energy, fuel, transport), crime and policing, NHS (hospitals, ambulances), defence, flights, protests/warnings, and world hours (borders, capitals). No BBC, Sky, GB News, ITV, Reuters, AP or other news-outlet footage.
2. **Match the clip to the card, not just the section.** Each clip gets keywords (for example "inflation", "fuel", "police", "A&E", "small boats"). When the big figure card changes every 9 seconds, the video box picks the 2026 clip whose keywords best match that figure's title. If none matches, it uses the section's clip. If the section has none, it shows the existing "No licensed clip for this topic" card.
3. **Country matching for world hours.** Clips tagged with a country play only when that country is on air. Untagged world clips are used as a fallback.
4. **Same labels as now.** Each clip shows the year, who filmed it, its licence, "trimmed & muted" and "not UKStats data". Small-boat footage must really show small boats, or its caption must say what it shows instead.

## Limits
- Free 2026 footage is scarce, especially of small boats. Some topics may still show the no-clip card.
- Each licence is checked on the clip's own page before it is added. Anything unclear is left out.

## Technical details
- Add an optional `keywords: string[]` to StreamClip in stream-clips.data.ts. Clips are trimmed to 30s, muted, converted to VP9 webm and uploaded via lovable-assets.
- Add `clipForCard(metricTitle, topic, clips, country)` in stream-clips.ts. It scores keyword hits on the title, keeps only clips filmed in 2026 or later, and falls back to clipsFor(topic). ClipBox in globe_.broadcast.tsx passes in the current card's title.
- Tests: best keyword match wins; fallback to the topic; a clip tagged with another country is never chosen; a pre-2026 clip is never chosen; news-outlet clips are still rejected.
- Preview only until you say "publish".
