# Live public camera feeds on the stream

## What changes
On the live stream, the video box shows a live public camera for the area on air, instead of a recorded clip. If no allowed camera is working for that place, the box goes back to today's 2026 clip.

## Which cameras are allowed
- Only cameras run by a government or transport authority that **publishes them openly for reuse**. Examples: Transport for London JamCams (London), Traffic Scotland (Glasgow, Edinburgh), and similar open city or traffic feeds abroad.
- Only cameras pointing at roads, bridges, ports and public squares. No private CCTV, police or shop cameras, and no feeds from hacked or "insecure camera" sites.
- Each camera's terms are checked before it is added, and the date it was checked is saved.
- Every feed carries a clear label: "LIVE public camera — [operator], [place]. Shows the scene only, not the figure on screen."

## How the right camera is picked
- UK hour: the camera matches the figure. Small boats → Dover port road, if Kent has an open camera. London figures → a JamCam. Scotland → Traffic Scotland.
- Other countries: the capital's open traffic or city camera, if one exists. Countries with no open camera keep the clip box or the "no footage" card.
- A dead or frozen camera is skipped after one failed refresh.

## What viewers should expect
- Most of these are **still pictures that refresh every 1–5 minutes**, or short 10-second loops, not smooth video. The box will say "updated X min ago".
- Many countries will have no allowed camera at the start.

## Limits
- No camera footage is ever presented as evidence of a statistic, protest or crossing.
- Cameras only appear on the stream page and globe, never in embeds or share images.

## Technical details
- New dated list of cameras (`stream-cameras.data.ts`): operator, licence link, place, country, topics/keywords, image or loop URL, refresh seconds, checked date.
- A pure picker `cameraForCard(card, country)` reuses the clip keyword matching; tests cover "no camera → clip fallback" and "non-allowed operator never picked".
- Pictures load through a POST server function with a short cache, so many viewers don't hit the operator's server directly and the stream respects their usage limits.
- The camera box replaces `ClipBox` only when a camera is found; otherwise `ClipBox` runs as now.
- Stays in preview until you say "publish".
