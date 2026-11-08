// Review-profile links for sponsors. Pure, shared by server validation and the UI.
export const REVIEW_PLATFORMS = ["trustpilot", "google", "feefo", "reviewsio", "facebook"] as const;
export type ReviewPlatform = (typeof REVIEW_PLATFORMS)[number];

export const REVIEW_LABELS: Record<ReviewPlatform, string> = {
  trustpilot: "Trustpilot", google: "Google reviews", feefo: "Feefo", reviewsio: "Reviews.io", facebook: "Facebook reviews",
};
export const REVIEW_EXAMPLES: Record<ReviewPlatform, string> = {
  trustpilot: "https://uk.trustpilot.com/review/yourdomain.com",
  google: "https://g.page/r/… or a Google Maps link to your business",
  feefo: "https://www.feefo.com/en-GB/reviews/your-business",
  reviewsio: "https://www.reviews.io/company-reviews/store/your-business",
  facebook: "https://www.facebook.com/yourpage/reviews",
};

const bare = (h: string) => h.toLowerCase().replace(/^www\./, "");

/** Returns a clean https URL, or an error message. Trustpilot must review the sponsor's own domain. */
export function normaliseReviewUrl(platform: ReviewPlatform, raw: string, sponsorDomain: string): { url: string } | { error: string } {
  const bad = { error: `That isn't a ${REVIEW_LABELS[platform]} review page. Example: ${REVIEW_EXAMPLES[platform]}` };
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return bad; }
  if (u.protocol !== "https:" || u.username || u.password || u.port || raw.length > 500) return bad;
  const host = u.hostname.toLowerCase();
  const path = u.pathname;
  let ok = false;
  switch (platform) {
    case "trustpilot": {
      const m = path.match(/^\/review\/([a-z0-9.-]+)\/?$/i);
      if (!["trustpilot.com", "www.trustpilot.com", "uk.trustpilot.com"].includes(host) || !m) return bad;
      if (bare(m[1]!) !== bare(sponsorDomain)) return { error: `Your Trustpilot page must be for your own website (${bare(sponsorDomain)}).` };
      return { url: `https://uk.trustpilot.com/review/${bare(m[1]!)}` };
    }
    case "google":
      ok = (host === "g.page" && /^\/[\w/-]+$/.test(path))
        || (host === "maps.app.goo.gl" && /^\/[\w-]+$/.test(path))
        || ((host === "www.google.com" || host === "google.com" || host === "www.google.co.uk") && path.startsWith("/maps/"))
        || (host === "search.google.com" && path.startsWith("/local/"));
      break;
    case "feefo": ok = host === "www.feefo.com" && /^\/[a-z-]{2,5}\/reviews\/[\w-]+\/?$/i.test(path); break;
    case "reviewsio": ok = (host === "www.reviews.io" || host === "reviews.io") && /^\/company-reviews\/store\/[\w.-]+\/?$/i.test(path); break;
    case "facebook": ok = (host === "www.facebook.com" || host === "facebook.com") && /^\/[\w.-]+\/reviews\/?$/i.test(path); break;
  }
  if (!ok) return bad;
  u.hash = "";
  if (platform !== "google") u.search = "";
  return { url: u.toString() };
}

export type DirectoryReview = { platform: ReviewPlatform; label: string; url: string };
