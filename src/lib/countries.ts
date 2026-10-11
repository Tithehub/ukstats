// Browser-safe country registry. UK keeps its own register at "/".

export interface Country {
  /** Lowercase URL code, e.g. "fr". */
  code: string;
  name: string;
  /** Eurostat geo code (Greece is "EL"); null when Eurostat does not cover it. */
  eurostat: string | null;
  /** National statistics office, credited alongside Eurostat. */
  office: string;
  officeUrl: string;
  euro: boolean;
  wave: 1 | 2;
}

const c = (code: string, name: string, office: string, officeUrl: string, euro: boolean, eurostat: string | null = code.toUpperCase(), wave: 1 | 2 = 1): Country => ({ code, name, eurostat, office, officeUrl, euro, wave });

export const COUNTRIES: Country[] = [
  c("at", "Austria", "Statistics Austria", "https://www.statistik.at", true),
  c("be", "Belgium", "Statbel", "https://statbel.fgov.be", true),
  c("bg", "Bulgaria", "National Statistical Institute", "https://www.nsi.bg", false),
  c("hr", "Croatia", "Croatian Bureau of Statistics", "https://dzs.gov.hr", true),
  c("cy", "Cyprus", "CYSTAT", "https://www.cystat.gov.cy", true),
  c("cz", "Czechia", "Czech Statistical Office", "https://www.czso.cz", false),
  c("dk", "Denmark", "Statistics Denmark", "https://www.dst.dk", false),
  c("ee", "Estonia", "Statistics Estonia", "https://www.stat.ee", true),
  c("fi", "Finland", "Statistics Finland", "https://stat.fi", true),
  c("fr", "France", "INSEE", "https://www.insee.fr", true),
  c("de", "Germany", "Destatis", "https://www.destatis.de", true),
  c("gr", "Greece", "ELSTAT", "https://www.statistics.gr", true, "EL"),
  c("hu", "Hungary", "Hungarian Central Statistical Office", "https://www.ksh.hu", false),
  c("ie", "Ireland", "Central Statistics Office", "https://www.cso.ie", true),
  c("it", "Italy", "Istat", "https://www.istat.it", true),
  c("lv", "Latvia", "Official Statistics Portal", "https://stat.gov.lv", true),
  c("lt", "Lithuania", "Statistics Lithuania", "https://www.stat.gov.lt", true),
  c("lu", "Luxembourg", "STATEC", "https://statistiques.public.lu", true),
  c("mt", "Malta", "National Statistics Office", "https://nso.gov.mt", true),
  c("nl", "Netherlands", "CBS", "https://www.cbs.nl", true),
  c("pl", "Poland", "Statistics Poland", "https://stat.gov.pl", false),
  c("pt", "Portugal", "INE Portugal", "https://www.ine.pt", true),
  c("ro", "Romania", "National Institute of Statistics", "https://insse.ro", false),
  c("sk", "Slovakia", "Statistical Office of the Slovak Republic", "https://slovak.statistics.sk", true),
  c("si", "Slovenia", "SURS", "https://www.stat.si", true),
  c("es", "Spain", "INE", "https://www.ine.es", true),
  c("se", "Sweden", "Statistics Sweden", "https://www.scb.se", false),
  c("no", "Norway", "Statistics Norway", "https://www.ssb.no", false),
  c("is", "Iceland", "Statistics Iceland", "https://statice.is", false),
  c("ch", "Switzerland", "Federal Statistical Office", "https://www.bfs.admin.ch", false),
  c("us", "United States", "BLS / BEA / US Treasury", "https://www.usa.gov/statistics", false, null, 2),
  c("ca", "Canada", "Statistics Canada", "https://www.statcan.gc.ca", false, null, 2),
  c("au", "Australia", "Australian Bureau of Statistics", "https://www.abs.gov.au", false, null, 2),
];

export function countryByCode(code: string): Country | undefined {
  return COUNTRIES.find((x) => x.code === code.toLowerCase());
}

export interface CountryMetric {
  id: string;
  title: string;
  value: string | null;
  period: string | null;
  /** ISO date Eurostat last updated the dataset. */
  asOf: string | null;
  cadence: string;
  source: string;
  sourceUrl: string;
  spark: number[];
  /** Raw latest number, used only for side-by-side comparison. */
  raw: number | null;
  note: string | null;
}

export interface CountryPayload {
  country: Country;
  metrics: CountryMetric[];
  fetchedAt: string;
}
