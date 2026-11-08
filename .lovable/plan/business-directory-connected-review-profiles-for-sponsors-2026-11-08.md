# Business directory: connected review profiles for sponsors

Only paying, approved sponsors appear in the directory, as now. Each one can now add links to its own review pages. The directory shows these as clear "See our reviews" badges, one per site.

## What sponsors get
- In the sponsor dashboard, a new **Review profiles** section with four optional boxes: Trustpilot, Google reviews, Feefo / Reviews.io and Facebook.
- Each box only accepts a link to that site's own review page. For example, Trustpilot only accepts `https://uk.trustpilot.com/review/<their-domain>` (or `www.trustpilot.com`). Anything else is refused with a plain message.
- **Trustpilot must match the sponsor's own website.** A sponsor can't connect another company's reviews.
- A changed link shows as "Waiting for approval" until you approve it.

## What visitors see
- Each listing shows a row of badges, such as "Trustpilot reviews" and "Google reviews". Each badge opens the review site in a new tab.
- A short note says: "Reviews are hosted by each review site. UKStats does not check, edit or score them."
- There is no star score typed in by the business, and no rating copied from the review sites. A self-reported rating could be invented, and copying ratings from the sites breaks their terms. If a review site later gives you official access, live star ratings can be added.

## What you get (admin)
- In the existing sponsor approvals screen, every pending review link appears with an Approve / Reject button and a link to check it first.
- Only approved links appear in the directory.

## Security choices (kept simple and solid)
- **No outside code on the site:** none of the review sites' scripts or widgets run on the site. These scripts are a common way in for attacks and trackers, and they slow pages down.
- **Strict link checks:** links are checked on the server against each site's real address. That means secure web addresses only, no hidden logins, and no tricks that look like the site's address but aren't.
- **Each sponsor edits only their own:** a sponsor can change only their own listing's links, and only you can approve them.
- **Safe outbound links:** links open with no access back to the site and without passing your page address on.
- **Tests** cover the link rules: allowed and refused addresses, and Trustpilot domain matching.

## Technical details
- New table `sponsor_review_links` (sponsor_id, platform enum-like text check, url, status pending/approved/rejected, timestamps), with GRANTs. RLS: the owner can select, insert and update rows where `sponsors.user_id = auth.uid()`. Admins update status via `has_role`. Public reads only through a SECURITY DEFINER function `list_directory_review_links()` that returns approved rows for visible sponsors.
- A validation trigger resets status to `pending` whenever the url changes from a non-admin.
- Pure validator `src/lib/review-links.ts` (`normaliseReviewUrl(platform, url, sponsorDomain)`), with host allowlists:
  - Trustpilot: `trustpilot.com`, `uk.trustpilot.com`, `www.trustpilot.com`, path `/review/<domain>`, where the domain must equal the sponsor's site domain
  - Google: `g.page`, `www.google.com/maps`, `maps.app.goo.gl`, `search.google.com/local/reviews`
  - Feefo: `www.feefo.com/*/reviews/*`; Reviews.io: `www.reviews.io/company-reviews/store/*`
  - Facebook: `www.facebook.com/<page>/reviews`
- Server functions: `saveReviewLinks` (requireSupabaseAuth; validates, then writes through `context.supabase`) and `setReviewLinkStatus` (admin check via `has_role`). `directoryEntries` gains a `reviews` array; the page renders badges with `rel="noopener noreferrer nofollow"`.
- The sponsor dashboard and admin approval UI are extended; there are no new routes, so menu links stay as they are.
