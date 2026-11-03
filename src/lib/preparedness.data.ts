/** Official household preparedness advice, quoted verbatim from each government page on the checked date. */
export const PREPAREDNESS_CHECKED = "2026-11-03";

export type PreparednessAdvice = {
  code: string;
  country: string;
  region: "UK" | "Europe" | "North America" | "Oceania";
  publisher: string;
  url: string;
  quote: string;
  waterQuote: string | null;
  days: number | null;
  waterLitresPerPersonPerDay: number | null;
  published: string | null;
};

export const PREPAREDNESS: PreparednessAdvice[] = [
  {
    code: "GB", country: "United Kingdom", region: "UK", publisher: "UK Government — Be Ready campaign",
    url: "https://beready.campaign.gov.uk/be-ready-for-emergencies/",
    quote: "Being ready for 3 days helps you manage while support reaches those most in need.",
    waterQuote: "Bottled water for 3 days — 3 litres per person per day for drinking. More would be needed for other tasks such as cooking and washing.",
    days: 3, waterLitresPerPersonPerDay: 3, published: null,
  },
  {
    code: "SE", country: "Sweden", region: "Europe", publisher: "Swedish Civil Contingencies Agency (MCF)",
    url: "https://www.mcf.se/en/advice-for-individuals/home-preparedness--prepping-for-at-least-a-week/basics-of-home-emergency-preparedness/",
    quote: "Devise a plan detailing how to maintain access to water, food, communication and heating in your home for at least a week.",
    waterQuote: null, days: 7, waterLitresPerPersonPerDay: null, published: null,
  },
  {
    code: "FI", country: "Finland", region: "Europe", publisher: "Suomi.fi — Finnish public services",
    url: "https://www.suomi.fi/guides/preparedness/how-to-prepare-for-incidents-and-crises/general-instructions-on-preparedness-home-emergency-supplies-and-on-what-to-do-in-different-situations",
    quote: "The recommendation is to reserve enough supplies to last you and other members of your household for at least 3 days.",
    waterQuote: null, days: 3, waterLitresPerPersonPerDay: null, published: null,
  },
  {
    code: "US", country: "United States", region: "North America", publisher: "Ready.gov (FEMA)",
    url: "https://www.ready.gov/kit",
    quote: "Being prepared means having your own food, water and other supplies to last for several days.",
    waterQuote: "Water (one gallon per person per day for several days, for drinking and sanitation)",
    days: null, waterLitresPerPersonPerDay: null, published: null,
  },
  {
    code: "CA", country: "Canada", region: "North America", publisher: "Government of Canada — Get Prepared",
    url: "https://www.canada.ca/en/services/policing/emergencies/preparedness/get-prepared/emergency-kits.html",
    quote: "Be prepared to be self-sufficient for at least 72 hours.",
    waterQuote: "You will need about four litres per person, per day.",
    days: 3, waterLitresPerPersonPerDay: 4, published: null,
  },
  {
    code: "NZ", country: "New Zealand", region: "Oceania", publisher: "National Emergency Management Agency — Get Ready",
    url: "https://getready.govt.nz/prepared/household/supplies",
    quote: "In an emergency, you may be stuck at home for three days or more.",
    waterQuote: "Water for three days or more — make sure you have at least nine litres of water for every person.",
    days: 3, waterLitresPerPersonPerDay: 3, published: null,
  },
];
