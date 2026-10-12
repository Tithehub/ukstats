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

export const IMF_COUNTRY_NAMES: Record<string, string> = {"AGO": "Angola", "ALB": "Albania", "ARG": "Argentina", "ARM": "Armenia, Republic of", "AUS": "Australia", "AUT": "Agence UMOA-Titres (UT)", "BEL": "Belgium", "BGR": "Bulgaria", "BLR": "Belarus, Republic of", "BRA": "Brazil", "CHE": "Switzerland", "CHL": "Chile", "CHN": "China, People's Republic of", "COL": "Colombia", "CRI": "Costa Rica", "CYP": "Cyprus", "CZE": "Czech Republic", "DEU": "Germany", "DNK": "Denmark", "DOM": "Dominican Republic", "ECU": "ECU", "EGY": "Egypt, Arab Republic of", "ESP": "Spanish peseta", "EST": "Estonia, Republic of", "EZB": "European Central Bank (ECB)", "FIN": "Finance Department (FIN)", "FRA": "France", "GBR": "United Kingdom", "GEO": "Georgia", "GRC": "Grievance Committee Chairman (GRC)", "GTM": "Guatemala", "HKG": "Hong Kong Special Administrative Region, People's Republic of China", "HND": "Honduras", "HUN": "Hungary", "IDN": "Indonesia", "IND": "India", "IRL": "Ireland", "ISL": "Iceland", "ITA": "Italy", "JAM": "Jamaica", "JOR": "Jordan", "JPN": "Japan", "KAZ": "Kazakhstan, Republic of", "KHM": "Cambodia", "KOR": "Korea, Republic of", "KOS": "Kosovo, Republic of", "LKA": "Sri Lanka", "LTU": "Lithuania, Republic of", "LUX": "Luxembourg", "LVA": "Latvia, Republic of", "MAR": "Morocco", "MDA": "Moldova, Republic of", "MEX": "Mexico", "MKD": "Macedonian denar", "MLT": "Malta", "MNG": "Mongolia", "MUS": "Mauritius", "MYS": "Malaysia", "NIC": "Nicaragua", "NLD": "Netherlands, The", "NOR": "Norway", "PER": "Peru", "PHL": "Philippines", "POL": "Poland, Republic of", "PRT": "Portugal", "PRY": "Paraguay", "ROU": "Romania", "RUS": "Russian Federation", "SAU": "Saudi Arabia", "SGP": "Singapore", "SLV": "El Salvador", "SRB": "Serbia, Republic of", "SVN": "Slovenia, Republic of", "SWE": "Sweden", "THA": "Thailand", "TUR": "Türkiye, Republic of", "UKR": "Ukraine", "URY": "Uruguay", "USA": "United States", "ZAF": "South Africa"};

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
