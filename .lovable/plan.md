# Post the livestream to X in one click (like Bluesky and Mastodon)

## What you'll get
- On the **Connections** page, a new **X** box next to Bluesky and Mastodon. You paste four keys from your X developer account once and press Connect. We check them with X straight away and show your handle (e.g. @ukstatsglobal) if they work.
- On the Agents page **Launch the livestream** box, X then appears in the "post to connected accounts" list. One press posts your message, the stream link and the YouTube thumbnail to X, the same as Bluesky and Mastodon. The result line shows a link to the new post, or X's own reason if it's refused.
- Drafts stay exactly as they are. Nothing posts on its own: a post only goes out when you press the button. The "open X's post box" link stays as a backup.

## What you need to do (one-off, about 10 minutes)
1. Sign in at developer.x.com with the @ukstatsglobal account and create a Project and App. The free tier allows about 500 posts a month, which is plenty for stream launches.
2. In the app's settings, set permissions to **Read and write**, then generate the **API Key and Secret** and the **Access Token and Secret**. Generate the token after you change the permission, or it will be read-only.
3. Paste the four values into the new X box on Connections.

## Limits
- Posts are limited to 280 characters. The box already counts these.
- If X refuses the picture, the post goes out without it and the result line says so.
- Your keys are stored privately, like the Bluesky and Mastodon ones, and are never shown again after saving.

## Technical details
- `src/lib/social.functions.ts`: add an `x` platform. The creds are apiKey, apiSecret, accessToken and accessSecret. Verify with `GET https://api.x.com/2/users/me`. Post with `POST https://api.x.com/2/tweets`, uploading media first via `POST https://api.x.com/2/media/upload`, then attach the media_ids. Signing is OAuth 1.0a HMAC-SHA1, done with Web Crypto so it works on the edge runtime. Pure signing helpers go in `src/lib/x-oauth.ts` with a test against X's documented signature example.
- `src/routes/connections.tsx`: X form fields and help text. `StreamLaunchComposer` needs no change beyond the platform list; trim the footer copy to include X.
- Errors pass through X's status and body. Saved memory "posting is always manual" still holds: posting happens only when the button is pressed.
