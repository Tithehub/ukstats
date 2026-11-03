# 24/7 YouTube live stream of the globe and news feed

## How it works

The website can't stream to YouTube by itself. Something has to keep the globe page open around the clock, record the screen and send it to YouTube. The plan has two parts.

```text
[ukstats.co.uk/globe/broadcast] -> [always-on computer: browser + recorder] -> YouTube Live (stream key)
```

### Part 1 – what I build on the site
A new **broadcast page** (`/globe/broadcast`) made for TV-style viewing:
- Full screen at 1920x1080, with no menus, buttons, cookie notices or support panels.
- Automatic bulletin: it rotates through countries (UK first), spins the globe, and shows the stats, government warnings, flights, boats and news-report cards, each with its source and date.
- A large "Latest" headline strip across the top, plus a clock and a "Live data from official sources – ukstats.co.uk" label.
- It reloads itself every few hours and after any data error, so it never freezes on a stale screen.
- It doesn't count as normal site traffic and isn't listed for search engines.
- It shows only what the site already shows. No new figures.

### Part 2 – what you set up (one time)
1. **YouTube:** in YouTube Studio, go to Create, then Go live, then Stream. Copy the **stream key**. New channels have to verify by phone and wait up to 24 hours before they can go live.
2. **An always-on computer** to run the stream. Pick one:
   - **Your own PC with OBS (free):** add a "Browser source" pointing at the broadcast page and paste the stream key. This is the simplest, but the PC has to stay on all the time.
   - **A small cloud server (about £10–25 a month, e.g. Hetzner or DigitalOcean):** I give you a ready-made setup script (headless Chrome plus ffmpeg) that restarts itself if anything crashes. Costs here are estimates.
   - **A paid restream service** that takes a web page as its source. This is the easiest option, but it costs the most.

## Things to know
- **YouTube video clips:** other channels' videos and thumbnails can be shown as links on the site. Rebroadcasting their footage inside your stream would break copyright, so the stream shows only headlines, thumbnails used as links, and our own data cards. In-screen video playback stays off.
- **Sound:** the stream needs an audio track. A silent stream works, or you can use royalty-free background music you supply.
- **Online Safety Act / live chat:** YouTube's own chat would sit under YouTube's moderation tools. You'd need to moderate it or switch it off.
- **Funding pause:** no ads or sponsor slots appear in the stream while the legal hold is in place.

## Technical details
- New route `src/routes/globe.broadcast.tsx` reuses `GlobeExplorer` with a `broadcast` prop. That prop hides the chrome, enables auto-advance and forces the 1920x1080 layout. The head sets `noindex`, and the route is left out of the sitemap.
- A watchdog reloads the page every 4 hours, and also when a query has failed for more than 10 minutes.
- Deliverable script saved to Files: `stream/run.sh` plus a systemd unit. It runs Xvfb, then Chromium in kiosk mode, then ffmpeg with x11grab and silent audio, sending 1080p30 at 4500k to `rtmp://a.rtmp.youtube.com/live2/$KEY`, and restarts automatically.
- The stream key is never stored on the site. It lives only on the streaming computer.
