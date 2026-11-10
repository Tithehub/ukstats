// Dated, credited press story featured on the UK home page and in the UK stream hour.
// Headline and standfirst are the publisher's own words, verbatim — not UKStats figures.
export interface FeaturedStory {
  headline: string;
  standfirst: string;
  publisher: string;
  url: string;
  published: string; // ISO
  streamUk: boolean;
}

export const FEATURED_STORY: FeaturedStory | null = {
  headline: "Far-right British MP outperforms most world leaders on X",
  standfirst: "Rupert Lowe’s 1.7bn views underscore the power of the platform’s owner Elon Musk to amplify voices from political fringes",
  publisher: "Financial Times",
  url: "https://www.ft.com/content/fe954496-6a1b-4644-9a7d-d99c53276bfd",
  published: "2026-11-08T05:00:10.931Z",
  streamUk: true,
};
