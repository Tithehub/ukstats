# Get the globe showing in your preview (on your Mac)

## What I found
- The site is running and a fresh load at your screen size shows the globe with no errors.
- Your preview window here isn't connected to the site at the moment. It looks like the open preview is an old copy from before my last changes reloaded it, so it may not be running the new code at all.

## Steps
1. **You:** press the refresh arrow above the preview, or close and reopen the project tab.
2. **Me:** once it reloads, I read what your preview reports for the globe: whether your Mac's graphics started, and any error message. I don't change anything during this check.
3. **Me, depending on what it shows:**
   - **Mac graphics refuse the globe:** I make the light mode start straight away on your Mac's graphics. You also get a clear message with a Try again button instead of an empty space.
   - **The globe crashes while starting:** I fix the cause shown in the error. The likeliest spot is my new Earth shading, which I can switch back to the previous shading on that computer only.
   - **It shows fine after the refresh:** nothing to fix.
4. I check the homepage and /globe again on desktop and phone sizes. Nothing published.

## Technical details
- Read the live tab with a read-only `lovable preview execute-js` snippet: WebGL renderer string, canvas count, globe section text, console errors.
- If shader compile fails on Apple GPUs (e.g. `cameraPosition`/derivative issues in ShaderMaterial), catch `onShaderError`/a renderer compile check and fall back to the previous simpler fragment shader.
- If `getContext` returns null, use the light mode (`antialias:false`, pixel ratio 1, no clouds).
