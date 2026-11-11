# Connect @ukstatsglobal on X using the pasted keys

## What happens
1. Check the four keys with X: consumer key and secret, access token and secret. If X accepts them, it shows the account name. If X rejects them, I stop and tell you why, and nothing is saved.
2. Save them as an X connection on your admin account, stored the same way as a key you type into the Connections page and never shown again. X then appears in the Agents page's **Launch the livestream** one-click list.
3. Leave out the Bearer token and the last two values (Client ID and secret); this setup doesn't use them.
4. Do not send a test post. Your first real post happens when you press the button.

## Technical details
- Verify with a one-off signed `GET /2/users/me`. Keys are read from a temporary file in /tmp that is deleted afterwards, and they never appear in output.
- Insert into `social_accounts` (platform "x", label "@<username>", credentials {apiKey, apiSecret, accessToken, accessSecret}) for the admin user, found through `user_roles`.
- Risk: these keys were pasted in chat. You can regenerate them in the X portal later and re-enter them on Connections.
