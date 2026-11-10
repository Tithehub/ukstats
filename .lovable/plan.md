## Sponsor dashboard: name, logo, website, QR link and pictures

The sponsor dashboard at /sponsor-dashboard already lets a signed-in sponsor change their name, website, regions, banner picture and tagline. It gains a logo, a separate QR link and a stream picture. Each upload box spells out exactly what to send. As now, changes need admin approval before they appear.

### What sponsors will see
A tidy form with four sections:

1. **Name and website**: as now.
2. **QR code link**: optional. Where the live stream QR code sends viewers, for example a special offer page. If left blank, it uses the website. A live QR preview shows beside the box.
3. **Logo**:
   - Square, at least 500 × 500 pixels (1000 × 1000 recommended).
   - PNG with a transparent background preferred; JPG or WebP also accepted.
   - Up to 1 MB.
   - Shown on the Sponsors page, the Business Directory and the PDF "Our sponsors" page.
4. **Pictures**:
   - **Website banner** (as now): 3 wide by 1 tall, at least 1536 × 512 pixels; JPG, PNG or WebP; up to 2 MB.
   - **Live stream picture**: 4 wide by 3 tall, 1200 × 900 recommended (at least 800 × 600); JPG, PNG or WebP; up to 2 MB. It fills the sponsor box on the stream. Tip: keep the left third calm and dark, because the name and QR code sit there.

Each upload is checked straight away for shape, size and file type, with a plain message if it doesn't fit, plus a preview and a "Remove" button.

Before approval, the dashboard shows "Waiting for approval". The stream and site keep the last approved version until then.

### Where it shows
- **Live stream sponsor box:** uses the sponsor's own stream picture and QR link once approved. The five current sponsors keep their prepared pictures until they upload their own.
- **Logos:** appear on /sponsors, the Business Directory and the PDF sponsors page.

### Technical
- **Database:** add nullable columns to `sponsors`: `logo_path`, `stream_path`, `qr_url`. Pending edits reuse the existing approval flow.
- **Storage:** reuse the private `sponsor-banners` bucket under the same owner-scoped paths.
- **Picture checks:** add `src/lib/banner-image.ts` constants and checkers for logos (square ±5%, min 500, 1 MB) and stream pictures (4:3 ±8%, min 800×600, 2 MB). Bytes are checked server-side in `banner.server.ts`, like banners.
- **Saving:** `saveSponsorDetails` accepts `logo_path`, `stream_path` and `qr_url`, validating https and ownership of the paths. `qr_url` is optional.
- **Signed links:** `getSponsorBannerBoard` signs `logo_path` and `stream_path` too, and returns `qr_url`.
- **Stream:** `BroadcastView` `sponsorSlide` prefers the signed stream picture over `STREAM_PICTURES`, then the banner. The QR uses `qr_url` or the website (with the existing `ref` tag).
- **Logos elsewhere:** shown in the sponsors page, directory and PDF where a logo exists.
- **UI:** split `MySponsorship` into sections with a shared `PictureUpload` component that shows the requirements text from the constants.
- **Tests and checks:** add tests for the new size, shape and MB rules, then sign in and check the form in the preview. Don't publish.
