// Registry of official sources for convictions linked to online / electronic messages.
// No figure is typed in here: a row only carries a value once a parser reads it from
// the publisher. Until then each row links to the official table so readers can check.
export interface SpeechRow {
  code: string;
  country: string;
  offences: string;
  source: string;
  sourceUrl: string;
  cadence: string;
  caveat: string;
  value: string | null;
  period: string | null;
}

export const LIKE_FOR_LIKE_WARNING =
  "These rows are not like-for-like. Each country defines offences differently, and no country publishes a count of convictions for social media posts alone — the official series cover all electronic messages, or speech offences whether online or not.";

export const SPEECH_ROWS: SpeechRow[] = [
  { code: "uk", country: "England and Wales", offences: "Communications Act 2003 s127; Malicious Communications Act 1988 s1; Online Safety Act 2023 communications offences", source: "Ministry of Justice — Criminal Justice System statistics, outcomes by offence", sourceUrl: "https://www.gov.uk/government/collections/criminal-justice-statistics", cadence: "Quarterly (annual tables each May)", caveat: "Covers phone calls, texts, emails and posts; social media is not split out.", value: null, period: null },
  { code: "sct", country: "Scotland", offences: "Communications Act 2003 s127; Hate Crime and Public Order (Scotland) Act 2021", source: "Scottish Government — Criminal Proceedings in Scotland", sourceUrl: "https://www.gov.scot/collections/criminal-proceedings-in-scotland/", cadence: "Annual", caveat: "Not online-only.", value: null, period: null },
  { code: "ni", country: "Northern Ireland", offences: "Communications Act 2003 s127; Malicious Communications (NI) Order 1988", source: "Department of Justice NI — Prosecutions and convictions", sourceUrl: "https://www.justice-ni.gov.uk/topics/statistics-and-research/prosecutions-and-convictions", cadence: "Annual", caveat: "Not online-only.", value: null, period: null },
  { code: "de", country: "Germany", offences: "StGB §130 incitement; §185 insult; §186–188 defamation", source: "Destatis — Strafverfolgungsstatistik (Fachserie 10 Reihe 3)", sourceUrl: "https://www.destatis.de/DE/Themen/Staat/Justiz-Rechtspflege/_inhalt.html", cadence: "Annual", caveat: "Online and offline offences combined.", value: null, period: null },
  { code: "fr", country: "France", offences: "Provocation, defamation and insult (Law of 29 July 1881); online harassment", source: "Ministère de la Justice — Références statistiques Justice", sourceUrl: "https://www.justice.gouv.fr/documentation/etudes-et-statistiques", cadence: "Annual", caveat: "Online and offline offences combined.", value: null, period: null },
  { code: "ie", country: "Ireland", offences: "Harassment, Harmful Communications and Related Offences Act 2020", source: "Central Statistics Office — Recorded crime / Courts Service annual report", sourceUrl: "https://www.cso.ie/en/statistics/crimeandjustice/", cadence: "Quarterly / annual", caveat: "Recorded offences, not convictions, for most series.", value: null, period: null },
  { code: "us", country: "United States", offences: "No federal speech-conviction series (First Amendment); federal threats under 18 USC 875", source: "US Sentencing Commission — Interactive data", sourceUrl: "https://www.ussc.gov/research/interactive-data-analyzer", cadence: "Annual", caveat: "Federal threats only; not a speech-offence count.", value: null, period: null },
  { code: "ca", country: "Canada", offences: "Criminal Code s319 hate propaganda; s372 indecent communications", source: "Statistics Canada — Adult criminal court statistics (Table 35-10-0027)", sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3510002701", cadence: "Annual", caveat: "Online and offline combined.", value: null, period: null },
  { code: "au", country: "Australia", offences: "Criminal Code s474.17 using a carriage service to menace, harass or offend", source: "Australian Bureau of Statistics — Criminal Courts, Australia", sourceUrl: "https://www.abs.gov.au/statistics/people/crime-and-justice/criminal-courts-australia", cadence: "Annual", caveat: "s474.17 is not published as its own line.", value: null, period: null },
];
