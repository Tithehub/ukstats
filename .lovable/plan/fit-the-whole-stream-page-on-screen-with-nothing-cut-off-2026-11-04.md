# Fit the whole stream page on screen with nothing cut off

## What is cut off today (seen in the 1920×1080 check)
- The globe's own news list runs off the bottom of the screen, behind the tickers.
- The globe itself spills under the two tickers at the bottom.
- The globe's own top strips (Latest and Official warnings) repeat our tickers and take up space.
- There is an empty band at the top, and a gap in the right panel.
- The search, Layers, Key and "New screen" buttons show on the stream, although viewers can't click them.

## Changes
1. **Fixed TV frame:** the page is laid out at exactly 1920×1080 and scaled to fit any window, so what the streaming computer captures matches what the studio preview shows.
2. **Set rows:** header, then a middle area, then two ticker rows. Each row has a fixed height, so nothing can push another row off the screen.
3. **Broadcast mode for the globe:**
   - The globe fills only its own box.
   - Its side list, top strips, buttons and "New screen" are hidden.
   - The markers, flights, boats and arrows all stay.
4. **Right panel fits its space:** figure card, video box and Up next. Long text is cut short with "…" instead of running off.
5. **Lower-third headline:** stays inside the globe box, kept to a maximum of two lines.
6. **Safe zones respected:** YouTube's title-bar and player-button areas get only the globe background, never text.
7. **Overflow check:** the studio page warns "Something is cut off" if any text runs past its box.

## Technical details
- A `broadcast` prop on GlobeExplorer hides the side panel, ticker, warnings row, toolbar and NewsScreens, and the globe fills its parent. The home page and /globe stay unchanged.
- In `globe_.broadcast.tsx`: a 1920×1080 root, with `transform: scale()` from the window size; CSS grid rows `120px 1fr 72px` plus safe-area padding; `overflow-hidden` and `min-h-0` on every cell; `line-clamp` on the card and lower third.
- The overflow check compares `scrollHeight` with `clientHeight` on elements marked `data-fit` and posts a message to the studio iframe.
- Check with Playwright at 1920×1080 and 1280×720: no element goes past the frame, and every segment is screenshotted.
