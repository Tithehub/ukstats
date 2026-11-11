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

## Daily clear-out of Agents page suggestions
- Pending suggestions older than 24 hours (draft social posts, findings, explainer drafts, improvement plans) are deleted automatically, so the page starts fresh each day with only the new overnight suggestions.
- Anything you already approved stays (approved explainers on the site and posts you've marked as used are kept).
- The page refreshes itself when the London date changes, so an open tab shows the new day's list.

### Technical details
- In the agents tick (`engine.server.ts`), before a run: delete rows with `created_at < now() - 24h` and pending/open status from `agent_posts`, `agent_findings`, `explainer_drafts`, plus `improvement_plans` older than 24h. Approved explainers never touched.
- Agents page reads also filter to the last 24h, so stale items vanish even if the clean-up hasn't run yet.
- `agents.tsx` invalidates its queries when the London day rolls over (minute check).
- Test: the age cutoff keeps a 23h item and drops a 25h item, and never drops approved explainers.
