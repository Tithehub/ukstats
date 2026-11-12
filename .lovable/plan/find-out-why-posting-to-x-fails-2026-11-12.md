# Find out why posting to X fails

## What I found
- Your X login was accepted when you saved it on 11 Nov, so X recognised the keys then.
- X is the only one of your three accounts that has never posted successfully.
- The reason for any failed post is only shown on screen once and then lost. There's nothing in the last hour's records, so I can't see what X said.

## Plan
1. **Check the saved X login now.** Ask X who the saved account is, which changes nothing. This tells us whether the keys still work.
2. **Send one real test post only after you say yes.** Post a short line with a link to ukstats.co.uk, then read X's reply. The usual causes, and their fixes:
   - "Read only" permission: change the app to "Read and write" in the X developer portal, make new access keys and save them again.
   - The X plan doesn't allow posting, or the monthly limit is used up: this is X's own setting, so nothing on the site can fix it.
   - The picture is refused: the post goes out without it, which already works.
3. **Keep the reason for each failure.** Store the last error message for each account, and show "Last failed: <reason>" next to X in the admin Marketing section, so failures can be checked later.
4. Fix whatever X names, then make the test post again.

## Technical details
- Add `last_error` and `last_error_at` to `social_accounts` (owner-only, as now). Set them in the `postToSocialAccounts` catch block, and clear them on success.
- Use the same OAuth signing as the existing `verify("x")` for the check.
