# Remove name from Support + build a proper Profile page

## 1. Take the name off the Support page
- Support page message: "I have donated the whole UKStats site to Restore Britain ... — Marco Mead" becomes "The whole UKStats site has been donated to Restore Britain, for Rupert Lowe, the team and the people, free of charge." with no signature.
- The Support page's search/share descriptions change from "Marco Mead has donated..." to "UKStats has been donated...".
- Check the footer dedication, the terms and the rest of the public site for any remaining mention of the name, and remove it. Private admin drafts are left alone.
- Update the saved project note so the name is never shown publicly again.

## 2. New Profile page (/profile, signed-in only)
Reached from "Your account" in the menu, and from the leaderboard and the sign-up confirmation.

Sections:
- **Real-name warning (top, always visible):** "Your nickname is shown publicly on leaderboards. We strongly recommend not using your real name." It shows again when you save a nickname, and asks you to confirm if the nickname looks like your real name (for example, it matches part of your email).
- **Nickname and email:** edit your nickname (2–24 characters); your email is shown read-only.
- **Avatar picture:** upload a square picture (PNG, JPG or WebP, up to 1 MB), preview it, or remove it. It is shown on your profile only, not on leaderboards. A warning says not to use a photo of yourself if you want to stay anonymous.
- **Games stats:** for each game, show days played, best score, today's score, and your Daily 5 streak, with "Play" links.
- **Change password:** a new password box with an eye icon and a confirm box.
- **Delete account:** a red section. You type DELETE to confirm, then your account, scores, nickname and avatar are permanently removed and you are signed out.

## 3. Sign-up
- The nickname box on Create account shows the same real-name warning beside it.

## Technical details
- Add a nullable `avatar_path` column to profiles. Add a private `avatars` storage bucket with owner-only read/write policies (`<uid>/...`). Show the picture through short-lived signed links.
- Server functions using requireSupabaseAuth: `myProfileStats` (game_scores grouped by game for the caller), `deleteMyAccount` (deletes the caller's game_scores, avatar files and profile, then the auth user through admin code, called only for the caller's own id).
- Route `src/routes/_authenticated/profile.tsx`. Add it to ACCOUNT_ITEMS in SiteHeader, and set noindex in head.
- Pure helper `looksLikeRealName(nickname, email)` with a test.
