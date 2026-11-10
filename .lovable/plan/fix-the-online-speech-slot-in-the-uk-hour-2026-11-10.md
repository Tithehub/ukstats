# Fix the Online Speech slot in the UK hour

## What's wrong
- The slot has only two spoken lines, so the presenter loops them for the whole slot (about two minutes once the hour is stretched to fill 60 minutes).
- The site holds **no official count** for online speech. Every source row (MoJ, Scotland, NI and others) is still "not published as a figure", so there's nothing real to show. We won't make one up.

## Changes
1. **Say each line once, then stop.** For the Online Speech slot (and the other short site-section slots: gold, tax vs welfare, council spending, safest, happiest, education), the presenter reads each line once. When the lines run out, the slot ends early and the next item starts. It doesn't repeat.
2. **Make the Online Speech slot useful without figures.** About five voiced lines, all true from the official source list:
   - No UK body publishes a count of convictions for social media posts alone.
   - The Ministry of Justice publishes outcomes under the Communications Act s127 and the Malicious Communications Act, covering calls, texts, emails and posts together. Tables come out every quarter, with the annual ones each May.
   - Scotland and Northern Ireland publish their own annual figures. These aren't online-only.
   - These figures can't be compared directly between countries.
   - Pointer: go to ukstats.co.uk/online-speech for the source links.
3. **On-screen cards instead of a blank panel.** Show the three UK publishers as cards, each with its name, how often it publishes, a "No live figure" label and its link. That matches the site's rule for sources without a feed.
4. **Time saved goes to the rest of the hour.** The slot drops from 1 share of the hour to a short fixed length, so the other slots stretch a little. Half-past headlines stay at :30.

## Technical details
- `stream-rundown.ts`: give `online-speech` a fuller `script` built from `SPEECH_ROWS` (UK rows only, no `value`), plus `cards` with `metric` unset and status "No live feed".
- `BroadcastView`: for segments marked `pointer: true`, stop looping `reads[step % len]` and hold the final line, or advance.
- `stream-schedule.ts`: lower the weight for pointer slots so the hour isn't padded with repeats. Update the schedule tests, and add a test that the online-speech script has no digits other than the statute section numbers, and none of its lines repeat.
- Rented streams stay unchanged. Nothing gets published until you approve.
