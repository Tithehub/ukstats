# Change the homepage livestream from the Agents page

## What you'll get
- A new **"Homepage livestream"** box on the Agents (admin) page. Paste any YouTube live link (or video ID), press Save, and the homepage and `/live` player switch to it straight away. No publishing needed.
- The box shows the current stream with its thumbnail, checks the link can be embedded before saving, and only admins can change it.
- Set the stream to **5To5U1Ccx-8** now (from your link).

## Technical details
- Store the stream ID in `payload_cache` row `live-stream` (`{ id, updatedAt }`), no new table.
- `src/lib/live-stream.functions.ts`: POST `getLiveStreamId` (public, falls back to `LIVE_STREAM_ID` in brand.ts) and POST `setLiveStreamId` (requireSupabaseAuth + has_role admin, parses youtube.com/live, watch?v=, youtu.be, shorts or bare 11-char ID, checks embeddable, writes via admin client inside handler).
- `LiveStreamPanel.tsx` and `live.tsx` read the ID from shared Query options (loader ensureQueryData); brand.ts default updated to `5To5U1Ccx-8`.
- Admin card in `agents.tsx`.
- Tests for the link parser (valid formats, rejected bad links).
