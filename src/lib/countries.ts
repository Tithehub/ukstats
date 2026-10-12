// Browser-safe country registry. UK keeps its own register at "/".
import type { Category } from "@/lib/uk-stats";

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
  /** Extra official agencies to credit on the Sources page (e.g. the US has several). */
  agencies?: { name: string; url: string }[];
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
  { ...c("us", "United States", "US Census Bureau", "https://www.census.gov", false, null, 2), agencies: [
    { name: "Bureau of Labor Statistics", url: "https://www.bls.gov" },
    { name: "Bureau of Economic Analysis", url: "https://www.bea.gov" },
    { name: "US Treasury — Fiscal Data", url: "https://fiscaldata.treasury.gov" },
    { name: "Federal Reserve", url: "https://www.federalreserve.gov" },
    { name: "Federal Reserve Bank of New York", url: "https://www.newyorkfed.org" },
    { name: "FBI Crime Data Explorer", url: "https://cde.ucr.cjis.gov" },
  ] },
  c("ca", "Canada", "Statistics Canada", "https://www.statcan.gc.ca", false, null, 2),
  c("au", "Australia", "Australian Bureau of Statistics", "https://www.abs.gov.au", false, null, 2),
];

export function countryByCode(code: string): Country | undefined {
  return COUNTRIES.find((x) => x.code === code.toLowerCase());
}

/** Capital used for the weather cards; alertSlug is the official warning feed, null where none is integrated. */
export interface CountryPlace {
  city: string;
  lat: number;
  lon: number;
  tz: string;
  alertSlug: string | null;
  /** Official warning page for the national weather service, shown when no feed is integrated. */
  alertUrl: string;
  alertSource: string;
}

export const PLACES: Record<string, CountryPlace> = {
  at: { city: "Vienna", lat: 48.21, lon: 16.37, tz: "Europe/Vienna", alertSlug: "austria", alertUrl: "https://www.zamg.ac.at", alertSource: "GeoSphere Austria (ZAMG)" },
  be: { city: "Brussels", lat: 50.85, lon: 4.35, tz: "Europe/Brussels", alertSlug: "belgium", alertUrl: "https://www.meteobelgium.be", alertSource: "Royal Meteorological Institute of Belgium" },
  bg: { city: "Sofia", lat: 42.7, lon: 23.32, tz: "Europe/Sofia", alertSlug: "bulgaria", alertUrl: "https://www.meteo.bg", alertSource: "National Institute of Meteorology and Hydrology" },
  hr: { city: "Zagreb", lat: 45.81, lon: 15.98, tz: "Europe/Zagreb", alertSlug: "croatia", alertUrl: "https://meteo.hr", alertSource: "Croatian Meteorological and Hydrological Service" },
  cy: { city: "Nicosia", lat: 35.17, lon: 33.36, tz: "Asia/Nicosia", alertSlug: "cyprus", alertUrl: "https://www.mgs.gov.cy", alertSource: "Cyprus Meteorological Service" },
  cz: { city: "Prague", lat: 50.09, lon: 14.42, tz: "Europe/Prague", alertSlug: "czechia", alertUrl: "https://www.chmi.cz", alertSource: "Czech Hydrometeorological Institute" },
  dk: { city: "Copenhagen", lat: 55.68, lon: 12.57, tz: "Europe/Copenhagen", alertSlug: "denmark", alertUrl: "https://www.dmi.dk", alertSource: "Danish Meteorological Institute" },
  ee: { city: "Tallinn", lat: 59.44, lon: 24.75, tz: "Europe/Tallinn", alertSlug: "estonia", alertUrl: "https://www.ilmateadus.ee", alertSource: "Estonian Environment Agency" },
  fi: { city: "Helsinki", lat: 60.17, lon: 24.94, tz: "Europe/Helsinki", alertSlug: "finland", alertUrl: "https://en.ilmatieteenlaitos.fi", alertSource: "Finnish Meteorological Institute" },
  fr: { city: "Paris", lat: 48.86, lon: 2.35, tz: "Europe/Paris", alertSlug: "france", alertUrl: "https://vigilance.meteofrance.fr", alertSource: "Météo-France" },
  de: { city: "Berlin", lat: 52.52, lon: 13.4, tz: "Europe/Berlin", alertSlug: "germany", alertUrl: "https://www.dwd.de", alertSource: "Deutscher Wetterdienst" },
  gr: { city: "Athens", lat: 37.98, lon: 23.73, tz: "Europe/Athens", alertSlug: "greece", alertUrl: "https://www.emy.gr", alertSource: "Hellenic National Meteorological Service" },
  hu: { city: "Budapest", lat: 47.5, lon: 19.04, tz: "Europe/Budapest", alertSlug: "hungary", alertUrl: "https://meteo.hu", alertSource: "Hungarian Meteorological Service" },
  ie: { city: "Dublin", lat: 53.35, lon: -6.26, tz: "Europe/Dublin", alertSlug: "ireland", alertUrl: "https://www.met.ie", alertSource: "Met Éireann" },
  it: { city: "Rome", lat: 41.9, lon: 12.5, tz: "Europe/Rome", alertSlug: "italy", alertUrl: "https://www.meteoam.it", alertSource: "Italian Meteorological Service" },
  lv: { city: "Riga", lat: 56.95, lon: 24.11, tz: "Europe/Riga", alertSlug: "latvia", alertUrl: "https://www.meteo.lv", alertSource: "Latvia Environment, Geology and Meteorology Centre" },
  lt: { city: "Vilnius", lat: 54.69, lon: 25.28, tz: "Europe/Vilnius", alertSlug: "lithuania", alertUrl: "https://www.meteo.lt", alertSource: "Lithuanian Hydrometeorological Service" },
  lu: { city: "Luxembourg", lat: 49.61, lon: 6.13, tz: "Europe/Luxembourg", alertSlug: "luxembourg", alertUrl: "https://www.meteolux.lu", alertSource: "Meteolux" },
  mt: { city: "Valletta", lat: 35.9, lon: 14.51, tz: "Europe/Malta", alertSlug: "malta", alertUrl: "https://www.meteo.gov.mt", alertSource: "Malta International Airport Meteorological Office" },
  nl: { city: "Amsterdam", lat: 52.37, lon: 4.9, tz: "Europe/Amsterdam", alertSlug: "netherlands", alertUrl: "https://www.knmi.nl", alertSource: "KNMI" },
  pl: { city: "Warsaw", lat: 52.23, lon: 21.01, tz: "Europe/Warsaw", alertSlug: "poland", alertUrl: "https://meteo.imgw.pl", alertSource: "Institute of Meteorology and Water Management" },
  pt: { city: "Lisbon", lat: 38.72, lon: -9.14, tz: "Europe/Lisbon", alertSlug: "portugal", alertUrl: "https://www.ipma.pt", alertSource: "IPMA" },
  ro: { city: "Bucharest", lat: 44.43, lon: 26.1, tz: "Europe/Bucharest", alertSlug: "romania", alertUrl: "https://www.meteo.ro", alertSource: "National Administration of Meteorology" },
  sk: { city: "Bratislava", lat: 48.15, lon: 17.11, tz: "Europe/Bratislava", alertSlug: "slovakia", alertUrl: "https://www.shmu.sk", alertSource: "Slovak Hydrometeorological Institute" },
  si: { city: "Ljubljana", lat: 46.05, lon: 14.51, tz: "Europe/Ljubljana", alertSlug: "slovenia", alertUrl: "https://meteo.arso.gov.si", alertSource: "Slovenian Environment Agency (ARSO)" },
  es: { city: "Madrid", lat: 40.42, lon: -3.7, tz: "Europe/Madrid", alertSlug: "spain", alertUrl: "https://www.aemet.es", alertSource: "AEMET" },
  se: { city: "Stockholm", lat: 59.33, lon: 18.07, tz: "Europe/Stockholm", alertSlug: "sweden", alertUrl: "https://www.smhi.se", alertSource: "Swedish Meteorological and Hydrological Institute" },
  no: { city: "Oslo", lat: 59.91, lon: 10.75, tz: "Europe/Oslo", alertSlug: "norway", alertUrl: "https://www.met.no", alertSource: "Norwegian Meteorological Institute" },
  is: { city: "Reykjavik", lat: 64.15, lon: -21.94, tz: "Atlantic/Reykjavik", alertSlug: "iceland", alertUrl: "https://vedur.is", alertSource: "Icelandic Meteorological Office" },
  ch: { city: "Bern", lat: 46.95, lon: 7.44, tz: "Europe/Zurich", alertSlug: "switzerland", alertUrl: "https://www.meteoswiss.admin.ch", alertSource: "MeteoSwiss" },
  us: { city: "Washington, D.C.", lat: 38.9, lon: -77.04, tz: "America/New_York", alertSlug: null, alertUrl: "https://alerts.weather.gov", alertSource: "US National Weather Service" },
  ca: { city: "Ottawa", lat: 45.42, lon: -75.7, tz: "America/Toronto", alertSlug: null, alertUrl: "https://weather.gc.ca", alertSource: "Environment and Climate Change Canada" },
  au: { city: "Canberra", lat: -35.28, lon: 149.13, tz: "Australia/Sydney", alertSlug: null, alertUrl: "https://www.bom.gov.au", alertSource: "Bureau of Meteorology" },
};

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
  /** Next-release wording; defaults to the Eurostat calendar. */
  next?: string;
  category?: Category;
  status?: "ok" | "unavailable" | "no-feed";
  history?: { time: string; value: number; formatted: string }[];
  calendarUrl?: string;
}

export interface CountryPayload {
  country: Country;
  metrics: CountryMetric[];
  fetchedAt: string;
}
