// Pure helpers for official gold reserves (IMF IRFCL). No network code here.

/** Fine troy ounces in one metric tonne. */
export const OZ_PER_TONNE = 32_150.7466;

/** Larger than any national holding ever declared to the IMF; a filing above
 * this is almost certainly a unit error, so it is shown but never ranked. */
export const IMPLAUSIBLE_TONNES = 9_000;

export const GOLD_SOURCE = {
  name: "IMF — International Reserves and Foreign Currency Liquidity (IRFCL)",
  url: "https://data.imf.org/en/datasets/IMF.STA:IRFCL",
  indicator: "Official reserve assets, gold volume (fine troy ounces)",
};

export type GoldRow = { iso3: string; name: string; tonnes: number; ounces: number; period: string; site: string | null };
export type GoldTable = { ranked: GoldRow[]; flagged: GoldRow[] };

/** ISO3 → UKStats country page code for the countries we cover. */
export const ISO3_TO_SITE: Record<string, string> = {
  GBR: "", AUT: "at", BEL: "be", BGR: "bg", HRV: "hr", CYP: "cy", CZE: "cz", DNK: "dk", EST: "ee", FIN: "fi", FRA: "fr", DEU: "de", GRC: "gr", HUN: "hu", IRL: "ie", ITA: "it", LVA: "lv", LTU: "lt", LUX: "lu", MLT: "mt", NLD: "nl", POL: "pl", PRT: "pt", ROU: "ro", SVK: "sk", SVN: "si", ESP: "es", SWE: "se", NOR: "no", ISL: "is", CHE: "ch", USA: "us", CAN: "ca", AUS: "au",
};

export const IMF_COUNTRY_NAMES: Record<string, string> = {"AGO": "Angola", "ALB": "Albania", "ARG": "Argentina", "ARM": "Armenia", "AUS": "Australia", "AUT": "Austria", "BEL": "Belgium", "BGR": "Bulgaria", "BLR": "Belarus", "BRA": "Brazil", "CHE": "Switzerland", "CHL": "Chile", "CHN": "China", "COL": "Colombia", "CRI": "Costa Rica", "CYP": "Cyprus", "CZE": "Czechia", "DEU": "Germany", "DNK": "Denmark", "DOM": "Dominican Republic", "ECU": "Ecuador", "EGY": "Egypt", "ESP": "Spain", "EST": "Estonia", "FIN": "Finland", "FRA": "France", "GBR": "United Kingdom", "GEO": "Georgia", "GRC": "Greece", "GTM": "Guatemala", "HKG": "Hong Kong SAR, China", "HND": "Honduras", "HUN": "Hungary", "IDN": "Indonesia", "IND": "India", "IRL": "Ireland", "ISL": "Iceland", "ITA": "Italy", "JAM": "Jamaica", "JOR": "Jordan", "JPN": "Japan", "KAZ": "Kazakhstan", "KHM": "Cambodia", "KOR": "South Korea", "KOS": "Kosovo", "LKA": "Sri Lanka", "LTU": "Lithuania", "LUX": "Luxembourg", "LVA": "Latvia", "MAR": "Morocco", "MDA": "Moldova", "MEX": "Mexico", "MKD": "North Macedonia", "MLT": "Malta", "MNG": "Mongolia", "MUS": "Mauritius", "MYS": "Malaysia", "NIC": "Nicaragua", "NLD": "Netherlands", "NOR": "Norway", "PER": "Peru", "PHL": "Philippines", "POL": "Poland", "PRT": "Portugal", "PRY": "Paraguay", "ROU": "Romania", "RUS": "Russian Federation", "SAU": "Saudi Arabia", "SGP": "Singapore", "SLV": "El Salvador", "SRB": "Serbia", "SVN": "Slovenia", "SWE": "Sweden", "THA": "Thailand", "TUR": "Türkiye", "UKR": "Ukraine", "URY": "Uruguay", "USA": "United States", "ZAF": "South Africa"};

/** ISO3 → ISO 3166-1 alpha-2, for flag rendering. Kosovo (XK) has no official emoji flag. */
export const ISO3_TO_ISO2: Record<string, string> = {"AGO": "AO", "ALB": "AL", "ARG": "AR", "ARM": "AM", "AUS": "AU", "AUT": "AT", "BEL": "BE", "BGR": "BG", "BLR": "BY", "BRA": "BR", "CHE": "CH", "CHL": "CL", "CHN": "CN", "COL": "CO", "CRI": "CR", "CYP": "CY", "CZE": "CZ", "DEU": "DE", "DNK": "DK", "DOM": "DO", "ECU": "EC", "EGY": "EG", "ESP": "ES", "EST": "EE", "FIN": "FI", "FRA": "FR", "GBR": "GB", "GEO": "GE", "GRC": "GR", "GTM": "GT", "HKG": "HK", "HND": "HN", "HUN": "HU", "IDN": "ID", "IND": "IN", "IRL": "IE", "ISL": "IS", "ITA": "IT", "JAM": "JM", "JOR": "JO", "JPN": "JP", "KAZ": "KZ", "KHM": "KH", "KOR": "KR", "KOS": "XK", "LKA": "LK", "LTU": "LT", "LUX": "LU", "LVA": "LV", "MAR": "MA", "MDA": "MD", "MEX": "MX", "MKD": "MK", "MLT": "MT", "MNG": "MN", "MUS": "MU", "MYS": "MY", "NIC": "NI", "NLD": "NL", "NOR": "NO", "PER": "PE", "PHL": "PH", "POL": "PL", "PRT": "PT", "PRY": "PY", "ROU": "RO", "RUS": "RU", "SAU": "SA", "SGP": "SG", "SLV": "SV", "SRB": "RS", "SVN": "SI", "SWE": "SE", "THA": "TH", "TUR": "TR", "UKR": "UA", "URY": "UY", "USA": "US", "ZAF": "ZA"};

/** Flag emoji for an ISO3 code; null when no flag exists (e.g. Kosovo's XK). */
export function flagEmoji(iso3: string): string | null {
  const iso2 = ISO3_TO_ISO2[iso3];
  if (!iso2) return null;
  return String.fromCodePoint(...[...iso2].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

/** "2026-M08" → "August 2026". */
export function goldPeriodLabel(p: string): string {
  const m = /^(\d{4})-M(\d{2})$/.exec(p);
  if (!m) return p;
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[Number(m[2]) - 1] ?? ""} ${m[1]}`.trim();
}

/** Parse the IMF SDMX CSV (detail=dataonly). Uses the combined monetary
 * authorities + central government sector so holdings split between a central
 * bank and a treasury (e.g. the UK) are counted once. Latest month per country. */
export function parseImfGold(csv: string): GoldTable | null {
  const lines = csv.trim().split(/\r?\n/);
  const head = lines[0]?.split(",") ?? [];
  const ci = head.indexOf("COUNTRY"), si = head.indexOf("SECTOR"), ti = head.indexOf("TIME_PERIOD"), vi = head.indexOf("OBS_VALUE");
  if (ci < 0 || si < 0 || ti < 0 || vi < 0) return null;
  const latest = new Map<string, { period: string; ounces: number }>();
  for (const line of lines.slice(1)) {
    const f = line.split(",");
    const iso3 = f[ci] ?? "", sector = f[si] ?? "", period = f[ti] ?? "", raw = f[vi] ?? "";
    if (sector !== "S1XS1311" || !/^[A-Z]{3}$/.test(iso3) || !(iso3 in IMF_COUNTRY_NAMES) || raw === "") continue;
    const ounces = Number(raw);
    if (!Number.isFinite(ounces) || ounces <= 0) continue;
    const prev = latest.get(iso3);
    if (!prev || period > prev.period) latest.set(iso3, { period, ounces });
  }
  const rows: GoldRow[] = [...latest].map(([iso3, v]) => ({
    iso3,
    name: IMF_COUNTRY_NAMES[iso3] ?? iso3,
    ounces: v.ounces,
    tonnes: v.ounces / OZ_PER_TONNE,
    period: v.period,
    site: iso3 in ISO3_TO_SITE ? (ISO3_TO_SITE[iso3] ?? null) : null,
  }));
  rows.sort((a, b) => b.tonnes - a.tonnes);
  return { ranked: rows.filter((r) => r.tonnes <= IMPLAUSIBLE_TONNES), flagged: rows.filter((r) => r.tonnes > IMPLAUSIBLE_TONNES) };
}
