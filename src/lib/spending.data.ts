// Official sources for UK public spending. Every URL was opened before adding.
// Checked 2026-11-05. Some council sites block automated checks (403); those
// are each council's own official domain and were left as-is.

export const SPENDING_CHECKED = "2026-11-05";

export type Nation = "England" | "Scotland" | "Wales" | "Northern Ireland" | "UK";

export interface SpendingSource {
  id: string;
  name: string;
  publisher: string;
  nation: Nation;
  url: string;
  covers: string;
  cadence: string;
}

export const SPENDING_SOURCES: SpendingSource[] = [
  {
    id: "pesa",
    name: "Public Expenditure Statistical Analyses (PESA)",
    publisher: "HM Treasury",
    nation: "UK",
    url: "https://www.gov.uk/government/collections/public-expenditure-statistical-analyses-pesa",
    covers: "All UK government spending by function (health, education, defence, etc.) and by department.",
    cadence: "Annual (July), with a spring update",
  },
  {
    id: "cra",
    name: "Country and Regional Analysis",
    publisher: "HM Treasury",
    nation: "UK",
    url: "https://www.gov.uk/government/collections/country-and-regional-analysis",
    covers: "Public spending per nation and English region, by function, including per person.",
    cadence: "Annual (November)",
  },
  {
    id: "wga",
    name: "Whole of Government Accounts",
    publisher: "HM Treasury",
    nation: "UK",
    url: "https://www.gov.uk/government/collections/whole-of-government-accounts",
    covers: "Audited accounts for over 10,000 UK public bodies combined.",
    cadence: "Annual",
  },
  {
    id: "spend25k",
    name: "Departmental spending over £25,000",
    publisher: "UK government departments",
    nation: "UK",
    url: "https://www.gov.uk/government/collections/spending-over-25-000",
    covers: "Individual payments over £25,000 by central government departments.",
    cadence: "Monthly per department",
  },
  {
    id: "eng-revenue",
    name: "Local authority revenue expenditure and financing",
    publisher: "Ministry of Housing, Communities and Local Government",
    nation: "England",
    url: "https://www.gov.uk/government/collections/local-authority-revenue-expenditure-and-financing",
    covers: "Every English council's day-to-day spending by service (budgets and outturn).",
    cadence: "Annual (budget in summer, outturn in autumn)",
  },
  {
    id: "eng-capital",
    name: "Local authority capital expenditure, receipts and financing",
    publisher: "Ministry of Housing, Communities and Local Government",
    nation: "England",
    url: "https://www.gov.uk/government/collections/local-authority-capital-expenditure-receipts-and-financing",
    covers: "English councils' spending on buildings, roads and other long-term assets.",
    cadence: "Quarterly and annual",
  },
  {
    id: "transparency-code",
    name: "Local Government Transparency Code 2015",
    publisher: "Ministry of Housing, Communities and Local Government",
    nation: "England",
    url: "https://www.gov.uk/government/publications/local-government-transparency-code-2015",
    covers: "Requires English councils to publish every payment over £500, contracts and senior pay.",
    cadence: "Payments published at least quarterly by each council",
  },
  {
    id: "scot-lfr",
    name: "Local government finance statistics (Local Financial Returns)",
    publisher: "Scottish Government",
    nation: "Scotland",
    url: "https://www.gov.scot/collections/local-government-finance-statistics/",
    covers: "Every Scottish council's spending by service.",
    cadence: "Annual",
  },
  {
    id: "wales-outturn",
    name: "Local authority revenue and capital outturn expenditure",
    publisher: "Welsh Government",
    nation: "Wales",
    url: "https://www.gov.wales/local-authority-revenue-and-capital-outturn-expenditure",
    covers: "Every Welsh council's revenue and capital spending by service.",
    cadence: "Annual",
  },
  {
    id: "ni-lg",
    name: "Local government (district councils)",
    publisher: "Department for Communities (NI)",
    nation: "Northern Ireland",
    url: "https://www.communities-ni.gov.uk/topics/local-government",
    covers: "Finance and accounts directions for Northern Ireland's 11 district councils.",
    cadence: "Annual",
  },
  {
    id: "niao",
    name: "Northern Ireland Audit Office",
    publisher: "Northern Ireland Audit Office",
    nation: "Northern Ireland",
    url: "https://www.niauditoffice.gov.uk/",
    covers: "Audited reports on NI councils and public bodies.",
    cadence: "Ongoing",
  },
];

export interface ExpenditureCategory {
  slug: string;
  label: string;
  level: "government" | "council";
  description: string;
  sourceIds: string[];
}

// Government categories follow PESA "spending by function" (UN COFOG).
// Council categories follow the service lines in the national returns.
export const EXPENDITURE_CATEGORIES: ExpenditureCategory[] = [
  { slug: "health", label: "Health", level: "government", description: "NHS and other health services.", sourceIds: ["pesa", "cra"] },
  { slug: "social-protection", label: "Social protection", level: "government", description: "Pensions, benefits, and social care support.", sourceIds: ["pesa", "cra"] },
  { slug: "education", label: "Education", level: "government", description: "Schools, colleges, universities and training.", sourceIds: ["pesa", "cra", "eng-revenue", "scot-lfr", "wales-outturn"] },
  { slug: "defence", label: "Defence", level: "government", description: "Armed forces and military equipment.", sourceIds: ["pesa"] },
  { slug: "public-order-safety", label: "Public order and safety", level: "government", description: "Police, courts, prisons and fire services.", sourceIds: ["pesa", "cra"] },
  { slug: "debt-interest", label: "Debt interest", level: "government", description: "Interest paid on government borrowing.", sourceIds: ["pesa"] },
  { slug: "economic-affairs", label: "Economic affairs", level: "government", description: "Business support, employment, science and agriculture.", sourceIds: ["pesa", "cra"] },
  { slug: "transport", label: "Transport", level: "government", description: "Roads, railways and local transport.", sourceIds: ["pesa", "cra", "eng-revenue", "scot-lfr", "wales-outturn"] },
  { slug: "housing-community", label: "Housing and community amenities", level: "government", description: "Housing, street lighting and water supply.", sourceIds: ["pesa", "cra", "eng-revenue", "scot-lfr", "wales-outturn"] },
  { slug: "environment", label: "Environment protection", level: "government", description: "Waste, pollution and nature protection.", sourceIds: ["pesa", "cra"] },
  { slug: "recreation-culture", label: "Recreation, culture and religion", level: "government", description: "Sport, libraries, museums and broadcasting.", sourceIds: ["pesa", "cra"] },
  { slug: "general-public-services", label: "General public services", level: "government", description: "Running government, tax collection and international services including aid.", sourceIds: ["pesa", "cra"] },
  { slug: "adult-social-care", label: "Adult social care", level: "council", description: "Care homes, home care and support for adults.", sourceIds: ["eng-revenue", "scot-lfr", "wales-outturn"] },
  { slug: "childrens-social-care", label: "Children's social care", level: "council", description: "Children in care, fostering and child protection.", sourceIds: ["eng-revenue", "scot-lfr", "wales-outturn"] },
  { slug: "public-health", label: "Public health", level: "council", description: "Sexual health, drug and alcohol services, health checks.", sourceIds: ["eng-revenue"] },
  { slug: "highways", label: "Highways and transport", level: "council", description: "Local roads, potholes, parking, buses and concessionary fares.", sourceIds: ["eng-revenue", "scot-lfr", "wales-outturn", "eng-capital"] },
  { slug: "council-housing", label: "Housing services", level: "council", description: "Homelessness, temporary accommodation and housing benefit administration.", sourceIds: ["eng-revenue", "scot-lfr", "wales-outturn"] },
  { slug: "waste-environmental", label: "Environmental and regulatory (incl. bins)", level: "council", description: "Waste collection and disposal, street cleaning, trading standards.", sourceIds: ["eng-revenue", "scot-lfr", "wales-outturn"] },
  { slug: "planning", label: "Planning and development", level: "council", description: "Planning applications, building control and economic development.", sourceIds: ["eng-revenue", "scot-lfr", "wales-outturn"] },
  { slug: "culture-leisure", label: "Cultural and related services", level: "council", description: "Libraries, leisure centres, parks and museums.", sourceIds: ["eng-revenue", "scot-lfr", "wales-outturn"] },
  { slug: "central-services", label: "Central services", level: "council", description: "Running the council, elections, council tax collection.", sourceIds: ["eng-revenue", "scot-lfr", "wales-outturn"] },
  { slug: "police-fire", label: "Police and fire", level: "council", description: "Police and fire authority spending recorded in local returns.", sourceIds: ["eng-revenue"] },
  { slug: "capital-spending", label: "Capital spending", level: "council", description: "Buildings, roads and long-term assets.", sourceIds: ["eng-capital", "wales-outturn"] },
  { slug: "payments-over-500", label: "Individual payments over £500", level: "council", description: "Each English council's own list of payments, published under the Transparency Code.", sourceIds: ["transparency-code"] },
];

export interface Council {
  slug: string;
  name: string;
  nation: Exclude<Nation, "UK">;
  region: string;
  places: string[];
  website: string;
  whatDoTheyKnow: string;
}

const wdtk = (s: string) => `https://www.whatdotheyknow.com/body/${s}`;

export const COUNCILS: Council[] = [
  { slug: "birmingham", name: "Birmingham City Council", nation: "England", region: "West Midlands", places: ["Birmingham", "Sutton Coldfield"], website: "https://www.birmingham.gov.uk", whatDoTheyKnow: wdtk("birmingham_city_council") },
  { slug: "manchester", name: "Manchester City Council", nation: "England", region: "North West", places: ["Manchester"], website: "https://www.manchester.gov.uk", whatDoTheyKnow: wdtk("manchester_city_council") },
  { slug: "leeds", name: "Leeds City Council", nation: "England", region: "Yorkshire and The Humber", places: ["Leeds", "Wetherby", "Otley"], website: "https://www.leeds.gov.uk", whatDoTheyKnow: wdtk("leeds_city_council") },
  { slug: "liverpool", name: "Liverpool City Council", nation: "England", region: "North West", places: ["Liverpool"], website: "https://www.liverpool.gov.uk", whatDoTheyKnow: wdtk("liverpool_city_council") },
  { slug: "bristol", name: "Bristol City Council", nation: "England", region: "South West", places: ["Bristol"], website: "https://www.bristol.gov.uk", whatDoTheyKnow: wdtk("bristol_city_council") },
  { slug: "sheffield", name: "Sheffield City Council", nation: "England", region: "Yorkshire and The Humber", places: ["Sheffield"], website: "https://www.sheffield.gov.uk", whatDoTheyKnow: wdtk("sheffield_city_council") },
  { slug: "newcastle", name: "Newcastle upon Tyne City Council", nation: "England", region: "North East", places: ["Newcastle upon Tyne", "Newcastle"], website: "https://www.newcastle.gov.uk", whatDoTheyKnow: wdtk("newcastle_city_council") },
  { slug: "nottingham", name: "Nottingham City Council", nation: "England", region: "East Midlands", places: ["Nottingham"], website: "https://www.nottinghamcity.gov.uk", whatDoTheyKnow: wdtk("nottingham_city_council") },
  { slug: "greater-london-authority", name: "Greater London Authority", nation: "England", region: "London", places: ["London"], website: "https://www.london.gov.uk", whatDoTheyKnow: wdtk("greater_london_authority") },
  { slug: "glasgow", name: "Glasgow City Council", nation: "Scotland", region: "Scotland", places: ["Glasgow"], website: "https://www.glasgow.gov.uk", whatDoTheyKnow: wdtk("glasgow_city_council") },
  { slug: "edinburgh", name: "City of Edinburgh Council", nation: "Scotland", region: "Scotland", places: ["Edinburgh", "Leith"], website: "https://www.edinburgh.gov.uk", whatDoTheyKnow: wdtk("city_of_edinburgh_council") },
  { slug: "aberdeen", name: "Aberdeen City Council", nation: "Scotland", region: "Scotland", places: ["Aberdeen"], website: "https://www.aberdeencity.gov.uk", whatDoTheyKnow: wdtk("aberdeen_city_council") },
  { slug: "cardiff", name: "Cardiff Council", nation: "Wales", region: "Wales", places: ["Cardiff"], website: "https://www.cardiff.gov.uk", whatDoTheyKnow: wdtk("cardiff_council") },
  { slug: "swansea", name: "Swansea Council", nation: "Wales", region: "Wales", places: ["Swansea"], website: "https://www.swansea.gov.uk", whatDoTheyKnow: wdtk("swansea_council") },
  { slug: "belfast", name: "Belfast City Council", nation: "Northern Ireland", region: "Northern Ireland", places: ["Belfast"], website: "https://www.belfastcity.gov.uk", whatDoTheyKnow: wdtk("belfast_city_council") },
];

export const FOI_LINKS = {
  govuk: "https://www.gov.uk/make-a-freedom-of-information-request",
  findCouncil: "https://www.gov.uk/find-local-council",
  ico: "https://ico.org.uk/for-the-public/official-information/",
  scotland: "https://www.itspublicknowledge.info/",
};
