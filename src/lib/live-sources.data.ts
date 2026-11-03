// Live coverage links per country, checked 2026-11-03. Official = government bodies;
// news = major outlets, never presented as official. Some official sites block automated
// checks (HTTP 403) but are the bodies' own published domains.
export const LIVE_SOURCES_CHECKED = "2026-11-03";

export interface LiveLink { label: string; url: string }
export interface LiveSources { official: LiveLink[]; news: LiveLink[] }

export const GLOBAL_NEWS: LiveLink[] = [
  { label: "Reuters — World", url: "https://www.reuters.com/world/" },
  { label: "AP News — World", url: "https://apnews.com/world-news" },
  { label: "BBC News — World", url: "https://www.bbc.co.uk/news/world" },
];

/** Keyed by countryKey(). */
export const LIVE_SOURCES: Record<string, LiveSources> = {
  france: {
    official: [
      { label: "Ministère de l'Intérieur", url: "https://www.interieur.gouv.fr/" },
      { label: "Ministère de l'Intérieur on X", url: "https://x.com/Interieur_Gouv" },
      { label: "Police nationale", url: "https://www.police-nationale.interieur.gouv.fr/" },
    ],
    news: [{ label: "France 24 (English)", url: "https://www.france24.com/en/" }],
  },
  germany: {
    official: [
      { label: "Federal Ministry of the Interior (BMI)", url: "https://www.bmi.bund.de/" },
      { label: "BMI on X", url: "https://x.com/bmi_bund" },
      { label: "Bundespolizei", url: "https://www.bundespolizei.de/" },
    ],
    news: [{ label: "DW (English)", url: "https://www.dw.com/en/" }],
  },
  poland: {
    official: [
      { label: "Ministry of Interior and Administration (MSWiA)", url: "https://www.gov.pl/web/mswia" },
      { label: "Policja", url: "https://www.policja.pl/" },
      { label: "Polska Policja on X", url: "https://x.com/PolskaPolicja" },
    ],
    news: [{ label: "Notes from Poland", url: "https://notesfrompoland.com/" }],
  },
  "united kingdom": {
    official: [
      { label: "Home Office", url: "https://www.gov.uk/government/organisations/home-office" },
      { label: "Police.uk", url: "https://www.police.uk/" },
    ],
    news: [],
  },
  "united states": {
    official: [
      { label: "Department of Homeland Security", url: "https://www.dhs.gov/" },
      { label: "FBI", url: "https://www.fbi.gov/" },
    ],
    news: [],
  },
};
