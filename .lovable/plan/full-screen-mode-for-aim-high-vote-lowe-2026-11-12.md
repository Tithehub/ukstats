# Full-screen mode for Aim High, Vote Lowe

## What you'll get
- A **Full screen** button (expand icon) in the corner of the game area, on every device.
- In full screen the game fills the whole screen with black bars only where needed, so the picture is never stretched. Start, difficulty, score and share panels still work inside it.
- An **Exit** button (and the Esc key on computers) returns to the normal page.
- On phones it tries to lock to landscape where the phone allows it; if you hold it upright the game still fits.
- iPhones don't allow real full screen for websites, so there it switches to a "fill the screen" mode that covers the page and hides scrolling — same button, same result for the player.
- Tapping and double-tap power punch keep working; the page won't scroll or zoom while playing.

## Technical details
- `LowesMission.tsx`: wrap game container in a ref; toggle via `requestFullscreen` (with `webkitRequestFullscreen` fallback); if unsupported, CSS fallback `fixed inset-0 z-50 bg-night` plus body scroll lock.
- Listen to `fullscreenchange` to sync state; try `screen.orientation.lock("landscape")` and ignore failure.
- Canvas in full screen: `h-full w-full object-contain` keeping 16:9 internal resolution.
- Check with Playwright at desktop and phone sizes.
