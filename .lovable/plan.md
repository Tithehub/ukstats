# Keep the YouTube stream running 24/7

## Why it stops today
The website only makes the broadcast page. YouTube gets the picture from OBS on the MacBook Pro. The stream ends when any of these happen:
- The Mac sleeps, the lid closes, it restarts or updates, or it loses Wi-Fi
- OBS is closed or crashes
- YouTube ends the broadcast after the connection drops. With "Auto-stop" on, it stops a few minutes after the signal goes, and a new stream link may be created

## Options
1. **Keep the Mac on (free, fragile):** turn off sleep in System Settings, use a wired network, set OBS to reconnect automatically, and turn off Auto-stop in YouTube Studio. One power cut or macOS update still stops it.
2. **A small cloud computer streams for us (recommended, about £10–£25 a month):** a rented server runs a hidden browser on https://ukstats.co.uk/globe/broadcast and sends it to YouTube non-stop, with automatic restarts. The Mac can be switched off. I write the setup script and step-by-step guide; you rent the server and paste in your stream key. The key is never stored on the site.
3. **Paid restreaming service** (for example Restream or Castr scheduled streams): easier, but these services stream recorded video, not our live page, so the figures would go out of date. Not suitable.

## What I'd build (option 2)
- A "Run 24/7" section on /globe/studio with the YouTube settings to change (Auto-stop off, a permanent stream key, DVR on) and links to them
- A ready-made server setup script (hidden browser + video encoder + watchdog that restarts within 30 seconds), saved to Files
- A health line on the studio page showing when the broadcast page last loaded, so you can see it's running

## Technical details
- Headless Chromium at 1920×1080 30fps with PulseAudio for the presenter's voice, piped to ffmpeg (H.264, 4,500 Kbps, 2s keyframes) to rtmp://a.rtmp.youtube.com/live2/<key>, managed by systemd with Restart=always.
- Stream key entered only on the server as an environment variable.
