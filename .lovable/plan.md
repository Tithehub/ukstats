# Go live on your YouTube channel

## What happens next
1. **Publish the site** so the broadcast page has a public address: https://ukstats.co.uk/globe/broadcast. This also puts the other preview-only changes live: news screens, globe key, news & police reports, military layer, migration/boats, supplier kit links and live chat.
2. **Check the broadcast page live**: it should load on its own, with no menus, start on the UK, and move through the bulletin. I will also make sure search engines don't list it.
3. **YouTube steps (you do these)**:
   - In YouTube Studio, verify the channel by phone. Live streaming can take up to 24 hours to switch on.
   - Go to Studio > Go live > Stream, set the stream to never end and to "Public", then copy the **stream key**. Never paste the key into the site or into this chat.
4. **The streaming computer**: you need one computer that stays on all the time. A small cloud server (about £5–£20 a month, at least 2 CPUs and 4 GB memory) or a spare PC running Linux will do. It runs the ready-made files in Files > stream (run.sh and ukstats-stream.service). They open the broadcast page and send it to YouTube at 1080p.
5. **Check the stream**: once the computer is sending, YouTube Studio should show "Excellent" connection health. The stream should keep itself running: the page reloads every 4 hours, a minute after any error, and the computer restarts the stream if it stops.

## Rules that still apply
- The stream shows no ads or sponsors while the legal hold is in place.
- Sound is silent, or royalty-free music you supply.
- YouTube's own live chat comes under YouTube's moderation, not ours.

## Before publishing: your decision
Live chat was kept preview-only because of the Online Safety Act risk. I will leave it out of the live site unless you say otherwise.

## Technical details
- Use the preview_ui publish tool, then run a Playwright check on the published /globe/broadcast page for console errors and the noindex meta tag.
- Hide the "Live chat" menu link and the /chat page behind a flag for the live site unless the user approves including them.
- Fix the dev quirk where mg=1 is stripped (a 307 redirect), so the broadcast URL's layer settings carry through.
- Add a short setup guide to /mnt/documents/stream/README.md covering the Ubuntu install (xvfb, chromium, ffmpeg), the STREAM_KEY env file, and the systemctl enable steps.
