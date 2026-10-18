## Fix the X @ukstatsglobal link

The link is in the footer of every page and points to x.com/ukstatsglobal. The cause of "it doesn't work" isn't confirmed yet, so step 1 is finding out why.

1. Open the preview in a test browser, click the X link in the footer, and record what happens: nothing at all, a blocked tab, an X "account doesn't exist" page, or a wrong address.
2. Fix based on what we find:
   - Link doesn't respond or is hidden/covered: fix the footer so the click opens X in a new tab.
   - X says the account doesn't exist: confirm the exact handle with Marco (spelling, or whether it's still being set up) and update the link.
   - Works in a normal tab but not inside the Lovable preview: explain that the preview window blocks it and it will work on the live site.
3. Make the link easier to spot: add a "Follow us on X" link in the top bar as well as the footer.
4. Check it in the preview on phone and desktop, then it goes live when Marco says "publish".

### Technical details
- Profile data: src/lib/social-profiles.ts; footer render: src/components/layout/SiteFooter.tsx (anchor with target="_blank").
- Header link added in SiteHeader using the same SOCIAL_PROFILES entry; update social-profiles.test.ts if the handle changes.
