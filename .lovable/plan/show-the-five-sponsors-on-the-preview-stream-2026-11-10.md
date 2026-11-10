## Show the five sponsors on the preview stream

All five sponsors (GoPharma, Gold.live, XPRE, YachtFino, RAREITUP) are already approved, switched on and paid in the real sponsor list. The preview stream doesn't show them because the preview only reads the separate test list, which is empty. Once you publish, the live stream shows them.

### What changes
- The stream's sponsor box always reads the real sponsor list, on the preview and live alike. You will see exactly what goes out on YouTube.
- Test sponsors made during checkout testing no longer appear in the stream box. The website's other sponsor spots are unchanged.
- I'll record a short check of the preview stream, catching each of the five sponsor cards in turn with the new pictures and blue "Supported by" label, and share the stills before anything is published.

### Technical
- `src/components/stream/BroadcastView.tsx` line ~104: call `getSponsorBannerBoard` with `environment: "live"` instead of `readPaymentsEnvironment() ?? "sandbox"`. The server still filters to approved, active, paid rows within dates, and region filtering stays as it is.
- Playwright at 1920x1080 on `/globe/broadcast?voice=off`: wait through the rotation of about 10 seconds per card, then screenshot the sponsor box for each sponsor. Save a contact sheet to `/mnt/documents/stream-pictures/`.
- Don't publish.
