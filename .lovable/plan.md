Make the new Orbit design the main live stream

What changes
- The main stream page (/globe/broadcast, the link OBS uses) shows the new Orbit design by default.
- The same official figures, headlines, warnings, schedule, sponsor and recommended cards, and the same presenter voice (your private OBS voice link keeps working unchanged).
- The old design stays available as a backup at /globe/broadcast?layout=classic, so you can switch OBS back instantly if anything goes wrong.
- The old ?layout=orbit link keeps working too.
- Unchanged: the portrait (phone) stream, rented customer streams, and the rest of the website.

Checks
- Open the main stream link and confirm it shows Orbit with no errors; confirm the classic backup link still shows the old design.
- Confirm the voice link still loads Orbit with the presenter voice enabled.

Going live
- The change is in preview only until published. After the checks I'll ask you before publishing, so the OBS/YouTube stream on ukstats.co.uk switches over only when you say so.

Technical details
- src/routes/globe_.broadcast.tsx: default landscape renders variant="orbit"; add "classic" to validateSearch to render the old view. Update the Stream Studio label and src/components/stream/AGENTS.md rule to say Orbit is the default with classic as fallback.
