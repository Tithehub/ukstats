# Stream sponsor box: correct picture shape

The sponsor box on the stream stays exactly as it is (400 x 300, the 4:3 shape, angled, with the title, QR code and "Scan to discover more" on the left over a soft navy shade). Only the pictures change, so they fill it properly.

## Recommended picture size
- **1200 x 900 pixels (4:3)**, JPG or PNG, under 2 MB. 800 x 600 is the smallest acceptable size.
- Keep the left 45% of the picture plain or dark: the title and QR code sit there. The main subject and logo should be on the right.

## Changes
1. **Fit:** each 4:3 picture fills the whole box with no cropping. A picture of a different shape is shown whole on the right side over navy, never cut off.
2. **Book cover:** make a 1200 x 900 version, with the cover shown whole on the right over the navy studio background. The title and QR stay on the left.
3. **Your other pictures:** once you upload them, I'll convert each one to 1200 x 900 in the same style. I'll keep each sponsor's logo and picture without cropping it or making anything up.
4. **Asking sponsors:** add the 1200 x 900 guidance, and the plain-left-side tip, next to the picture upload on the sponsor dashboard and advertise pages. Add a separate optional "Stream picture" upload there, checked for 4:3 and at least 800 x 600. Website banners keep their current 3:1 rule. Until a sponsor uploads a stream picture, their banner is shown whole as in step 1.
5. **Check:** capture stills of the box with the book, the inquiry card and at least one sponsor, and check them at full size before you publish.

## Technical notes
- New nullable stream picture fields on the sponsor record, mirroring the banner fields. The server checks them from the file bytes (4:3 within tolerance, at least 800 x 600), and they need admin approval, the same as banners.
- OrbitSponsor uses the stream picture if there is one, otherwise the banner with `object-contain`, anchored right.
- Book stream picture stored as a CDN asset.
- Nothing is published until you say so.
