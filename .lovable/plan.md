# Go live on YouTube: what you do

## Me first
- Publish ukstats.co.uk (the security check already came back clean), then check that the broadcast page loads.

## You, on the Mac
1. Install OBS from obsproject.com and open it. Skip the setup wizard.
2. In OBS → Settings → Video, set both resolutions to 1920x1080 and the frame rate to 30.
3. In OBS → Settings → Output, set the video bitrate to 6000 Kbps and the keyframe interval to 2.
4. Under Sources, click + → Browser. Set URL `https://ukstats.co.uk/globe/broadcast`, width 1920, height 1080, and tick "Control audio via OBS". Then right-click it → Transform → Fit to screen.
5. In the Audio Mixer, mute the Mic and Desktop Audio (leave the Browser source on).
6. In YouTube Studio, click Create → Go live → Stream. Paste the title and description from ukstats.co.uk/globe/studio, set "Not made for kids", choose **Unlisted**, and copy the **stream key**. Never send me the key.
7. In OBS → Settings → Stream, choose Service YouTube → "Use Stream Key", paste the key, then click OK.
8. Click **Start Streaming** in OBS. Within about 20 seconds YouTube Studio shows the picture. Wait for connection health to say "Excellent".
9. Check the globe, the Top 6 panel, the tickers and the clip credits, then press **Go live**.
10. When it all looks right, change the visibility to **Public**. Keep the Mac plugged in, and in System Settings → Displays/Battery stop it sleeping.
11. Send me the watch link (youtube.com/live/...). I'll point the "Watch live" buttons at it and publish again.
