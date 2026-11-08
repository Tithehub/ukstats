# Get the presenter's voice into OBS

## What your screenshot shows

- The OBS Browser address is `https://ukstats.co.uk/globe/broadcast`. That's the plain public address, with no private voice link.
- Her name strap says "READING ON SCREEN". That's the status for "voice not allowed". Her mouth moves, but no sound is made.
- So OBS is set up correctly ("Control audio via OBS" is ticked). It just isn't using the private link yet.

## Step 1: what you do in OBS (no code change needed)

1. In your normal browser, sign in as admin on ukstats.co.uk and open **Stream studio** (`/globe/studio`).
2. Press **Copy OBS link** in the "Private OBS link (voice on)" box.
3. In OBS, open the Browser source's Properties and click in the **URL** box. Delete the whole address, paste the copied link, then press **OK**.
4. If she still says "Reading on screen", right-click the Browser source, choose **Refresh cache of current page**, and wait about 10 seconds.
5. A **Browser** level meter should now show in the Audio Mixer. Check it isn't muted. Her strap should now say **Speaking**.

## Step 2: small studio-page improvement (what I'll build if you approve)

This makes the link impossible to miss and easy to copy.

- Show the full private link in a box you can select, next to the Copy button, in case copying doesn't work on your Mac.
- If the studio page can't load the link (for example, if you're not signed in as admin), say so in red. Right now the box just doesn't appear.
- Add a short "Check it's working" line: the strap should say "Speaking", not "Reading on screen".

The link stays visible only to signed-in admins. Viewers never see it, and it's still removed from the address once the stream page opens.

## Technical details

- `ObsVoiceLink` in `src/routes/globe_.studio.tsx`: render a read-only `<input>` with the URL (click selects all). Track the error state from `getStreamVoiceLink()` and show an "admin sign-in required" message instead of returning null.
- No change to `speakLine`, the voice key check, or the broadcast page.
