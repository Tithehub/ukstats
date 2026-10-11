// Browser-safe region definitions for the regional dashboards.

export interface RegionDef {
  slug: string;
  /** ONS geography code used by the UK HPI layer. */
  code: string;
  name: string;
  /** Police force area names (as ONS publishes them) that make up this region. */
  pfas: string[];
  /** Which map boundary kind applies to this region's crime data. */
  crimeSource: "pfa" | "scotland-council" | "psni";
  blurb: string;
}

export const REGIONS: RegionDef[] = [
  {
    slug: "north-east",
    code: "E12000001",
    name: "North East",
    pfas: ["Cleveland", "Durham", "Northumbria"],
    crimeSource: "pfa",
    blurb: "North East England — recorded crime by police force area and average house prices.",
  },
  {
    slug: "north-west",
    code: "E12000002",
    name: "North West",
    pfas: ["Cheshire", "Cumbria", "Greater Manchester", "Lancashire", "Merseyside"],
    crimeSource: "pfa",
    blurb: "North West England — recorded crime by police force area and average house prices.",
  },
  {
    slug: "yorkshire-and-the-humber",
    code: "E12000003",
    name: "Yorkshire and The Humber",
    pfas: ["Humberside", "North Yorkshire", "South Yorkshire", "West Yorkshire"],
    crimeSource: "pfa",
    blurb: "Yorkshire and The Humber — recorded crime by police force area and average house prices.",
  },
  {
    slug: "east-midlands",
    code: "E12000004",
    name: "East Midlands",
    pfas: ["Derbyshire", "Leicestershire", "Lincolnshire", "Northamptonshire", "Nottinghamshire"],
    crimeSource: "pfa",
    blurb: "East Midlands — recorded crime by police force area and average house prices.",
  },
  {
    slug: "west-midlands",
    code: "E12000005",
    name: "West Midlands",
    pfas: ["Staffordshire", "Warwickshire", "West Mercia", "West Midlands"],
    crimeSource: "pfa",
    blurb: "West Midlands — recorded crime by police force area and average house prices.",
  },
  {
    slug: "east-of-england",
    code: "E12000006",
    name: "East of England",
    pfas: ["Bedfordshire", "Cambridgeshire", "Essex", "Hertfordshire", "Norfolk", "Suffolk"],
    crimeSource: "pfa",
    blurb: "East of England — recorded crime by police force area and average house prices.",
  },
  {
    slug: "london",
    code: "E12000007",
    name: "London",
    pfas: ["Metropolitan Police", "City of London", "London, City of"],
    crimeSource: "pfa",
    blurb: "London — recorded crime by police force area and average house prices.",
  },
  {
    slug: "south-east",
    code: "E12000008",
    name: "South East",
    pfas: ["Hampshire", "Kent", "Surrey", "Sussex", "Thames Valley"],
    crimeSource: "pfa",
    blurb: "South East England — recorded crime by police force area and average house prices.",
  },
  {
    slug: "south-west",
    code: "E12000009",
    name: "South West",
    pfas: ["Avon and Somerset", "Devon and Cornwall", "Dorset", "Gloucestershire", "Wiltshire"],
    crimeSource: "pfa",
    blurb: "South West England — recorded crime by police force area and average house prices.",
  },
  {
    slug: "scotland",
    code: "S92000003",
    name: "Scotland",
    pfas: [],
    crimeSource: "scotland-council",
    blurb:
      "Scotland — recorded crime by council area, average house prices and live NHS performance figures.",
  },
  {
    slug: "wales",
    code: "W92000004",
    name: "Wales",
    pfas: ["Dyfed-Powys", "Gwent", "North Wales", "South Wales"],
    crimeSource: "pfa",
    blurb: "Wales — recorded crime by police force area and average house prices.",
  },
  {
    slug: "northern-ireland",
    code: "N92000002",
    name: "Northern Ireland",
    pfas: [],
    crimeSource: "psni",
    blurb:
      "Northern Ireland — average house prices; recorded crime is published separately by the PSNI.",
  },
];

export function regionBySlug(slug: string): RegionDef | null {
  return REGIONS.find((r) => r.slug === slug) ?? null;
}

/** Normalise a police force area name for comparison ("Devon & Cornwall" → "devon and cornwall"). */
export function normPfa(name: string): string {
  return name.toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ").trim();
}
