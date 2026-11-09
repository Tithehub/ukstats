# Globe improvements, round 2

## 1. More live cameras
- Look for more public-authority open camera feeds in new countries (for example Norway, Sweden, Denmark, Netherlands, Ireland, Spain, Japan, Australia, Canada provinces, US state DOTs). Add only feeds that are free and need no key.
- Mark a camera LIVE only if it is continuous video. Still images and loops stay labelled as such.
- Report which countries were added and which were blocked.

## 2. Speed and phones
- Load the camera list and heavy layers only when someone switches them on.
- Reduce globe detail on phones and low-power devices so it runs smoothly.
- Check the controls and panels on phone, tablet and desktop sizes, and fix anything that overlaps or is hard to tap.

## 3. News clusters
- Group the existing news and police headlines by place, so one marker shows "5 stories" and opens a list.
- Headlines stay word-for-word and labelled news, separate from official warnings.

## 4. Sharper, more cinematic look
- Higher-quality Earth image, soft lighting, glowing atmosphere edge.
- Glowing city lights on the night side when Day and night is on.
- Optional faint cloud layer, off on phones to keep it fast.

## Technical notes
- Cameras: extend stream-cameras data with operator source, live flag, checked date.
- Clusters: pure grouping helper with a test; reuse news-reports cache, no new fetching.
- Lazy-load layer data on toggle; device-tier check for texture size and cloud layer.
- Check in the browser at phone and desktop sizes before finishing.
