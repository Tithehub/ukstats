# Recent, relevant footage for the live stream

## The copyright reality
There is no "copyright timeframe" that makes recent BBC, Sky, GB News or other broadcaster footage free to use. In the UK, broadcast copyright lasts 50 years, and YouTube's Content ID would strike or block the stream within minutes. "Fair dealing" for news reporting doesn't cover re-broadcasting other channels' footage on a loop. So news-outlet clips stay blocked. Instead we'll use the most recent footage that is genuinely free to reuse.

## What we'll do
1. **Recent footage only for main segments.** Main segments only play clips filmed in the last 24 months. Older "archive" clips (for example the 1897 Calais film and the 2009 CBP clip) are only used when no recent clip exists, and are clearly labelled "Archive footage".
2. **Add recent official footage, which is free to reuse:**
   - UK Parliament recordings (Open Parliament Licence): Commons debates and PMQs on small boats, the economy, NHS and crime.
   - UK government (Open Government Licence): Home Office, MoD/RAF/Royal Navy, Border Force and No.10 releases where the page states OGL.
   - US government (public domain): CBP, DHS and Defense footage for world hours.
   - Recent Wikimedia Commons clips (CC BY / CC BY-SA, 2024 onwards).
   Before adding a clip we check its licence on its own page, and we record the filming date and who filmed it.
3. **Match footage to the topic and country.** Clips are tagged by topic (boats, economy, NHS and so on) and country. The newest matching clip plays first.
4. **Show how recent each clip is.** The caption shows "Filmed [date]" next to the credit and licence.
5. **Paid news licence, later.** The Reuters/AP slot stays ready but switched off until the payment hold lifts. That's the only legal way to show real broadcaster news footage.

## Limits
- There may be no free-to-reuse recent footage of the small boats themselves. Border Force or Parliament footage will be used where its licence allows.
- Some topics may only have a few recent clips, so they will repeat.

## Technical details
- `stream-clips.ts`: add `filmed` date ranking and a `RECENT_MONTHS = 24` window. `clipsFor` returns recent clips first and falls back to archive.
- `stream-clips.data.ts`: new dated entries with a new CHECKED stamp. Clips are trimmed to 30s, muted, converted to VP9 webm and uploaded as `.asset.json`.
- ClipBox caption adds the filming date.
- Tests cover the rules that recent clips beat archive, news outlets are always rejected, and archive is used only as a fallback.
