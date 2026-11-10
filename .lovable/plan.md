# Play the UKStats live stream inside the X feed

X won't play a YouTube video in the feed. A YouTube link only shows as a picture card that opens YouTube. To get the stream playing in the feed, OBS has to send it to X as well as YouTube.

## Steps (on your computer, no website changes)
1. Sign in at studio.x.com as @ukstatsglobal, open **Producer**, and create a source. X gives you an RTMP address and a stream key. Going live on X may need X Premium on the account.
2. In OBS, install the free "Multiple RTMP outputs" plugin (obs-multi-rtmp). Add a new target with X's address and key, keeping YouTube as the main stream.
3. Use 1920x1080, 30fps, about 6,000 kbps video and AAC audio, with a keyframe every 2 seconds.
4. Start the YouTube stream, then the X target. In Producer, create the broadcast with a title, then post it as a tweet. It will play in people's feeds.
5. Pin that post to the top of @ukstatsglobal.

## Optional site change (only if you want it)
- Add a "Watch on X" button next to "Watch on YouTube" on the home page and /live.

## Notes
- Sending to two places doubles your upload use. You need about 15 Mbps of steady upload speed.
- Nothing posts automatically. You start each X broadcast yourself.
