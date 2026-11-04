// Dated snapshot of official documents on grooming gangs (group-based child sexual
// exploitation). Every entry quotes or closely summarises the publisher's own words.
// Links checked 2026-11-04. Never add a figure that is not in a linked official document.

export const CHECKED = "2026-11-04T02:20:00Z";

export const INQUIRY_HOME = "https://www.grooming-gangs.independent-inquiry.uk/about-the-inquiry/";
export const GOV_COLLECTION = "https://www.gov.uk/government/collections/independent-inquiry-into-grooming-gangs";
export const CASEY_URL = "https://www.gov.uk/government/publications/national-audit-on-group-based-child-sexual-exploitation-and-abuse";
const CASEY_ACC = "https://www.gov.uk/government/publications/national-audit-on-group-based-child-sexual-exploitation-and-abuse/national-audit-on-group-based-child-sexual-exploitation-and-abuse-accessible";

export type Source = { publisher: string; title: string; url: string; published: string };

export const STATUS = {
  name: "Statutory Independent Inquiry into Grooming Gangs",
  basis: "Inquiries Act 2005 — full powers to compel witnesses and documents",
  coverage: "England and Wales",
  chair: "Baroness Anne Longfield CBE",
  panel: ["Zoë Billingham CBE", "Eleanor Kelly CBE"],
  adviser: "Baroness Casey of Blackstock (adviser to the chair and panel)",
  announced: "2025-12-09",
  termsFinal: "2026-03-31",
  length: "3 years",
  funding: "£65 million committed by the government",
  firstAreas: ["Oldham", "Bradford and Keighley", "London", "Birmingham"],
  finalReport: null as string | null, // not yet published
  sources: [
    { publisher: "Home Office", title: "Update on Independent Inquiry into Grooming Gangs", url: "https://www.gov.uk/government/news/update-on-independent-inquiry-into-grooming-gangs", published: "2025-12-09" },
    { publisher: "Home Office", title: "Independent Inquiry into Grooming Gangs (collection, final terms of reference)", url: GOV_COLLECTION, published: "2026-03-31" },
    { publisher: "The Inquiry", title: "About the Inquiry", url: INQUIRY_HOME, published: "2026-03-31" },
  ] as Source[],
};

export type TimelineEntry = { date: string; title: string; detail: string; source: Source };

const casey = (published = "2025-06-16"): Source => ({ publisher: "Home Office (Baroness Casey)", title: "National Audit on Group-based Child Sexual Exploitation and Abuse", url: CASEY_ACC, published });

export const TIMELINE: TimelineEntry[] = [
  { date: "2014-08-26", title: "Jay report on Rotherham published", detail: "The report finds at least 1,400 underage girls were abused between 1997 and 2013 (as summarised in the Casey audit timeline).", source: casey() },
  { date: "2014-08-01", title: "Operation Hydrant established", detail: "Set up to co-ordinate multiple non-recent child sexual abuse investigations across the UK.", source: casey() },
  { date: "2015-03-03", title: "Oxfordshire serious case review (Operation Bullfinch)", detail: "Finds as many as 373 children could have been victims of child sexual exploitation, and serious errors by police and social services.", source: casey() },
  { date: "2022-07-12", title: "Telford Independent Inquiry published", detail: "Finds up to 1,000 children may have been sexually exploited between 1989 and 2017, with failings across agencies.", source: casey() },
  { date: "2022-10-20", title: "IICSA final report published", detail: "The Independent Inquiry into Child Sexual Abuse publishes its final report on child sexual abuse in England and Wales.", source: casey() },
  { date: "2025-01-15", title: "National audit commissioned", detail: "The Prime Minister and Home Secretary commission Baroness Casey's national audit (formally launched February 2025).", source: { publisher: "Home Office", title: "National Audit — publication page", url: CASEY_URL, published: "2025-06-16" } },
  { date: "2025-06-16", title: "Casey national audit published", detail: "Twelve recommendations, including a national inquiry and national police operation (recommendation 2). The government says it is implementing every recommendation.", source: casey() },
  { date: "2025-12-09", title: "Chair and panel appointed", detail: "Baroness Longfield appointed chair with Zoë Billingham and Eleanor Kelly; three-year statutory inquiry, £65 million committed.", source: STATUS.sources[0] },
  { date: "2026-03-31", title: "Final terms of reference published", detail: "Published after public consultation, with letters between the Home Secretary and the chair.", source: STATUS.sources[1] },
];

export type Finding = { report: string; quote: string; source: Source };

export const FINDINGS: Finding[] = [
  { report: "Casey audit — foreword", quote: "we are talking about multiple sexual assaults committed against children by multiple men on multiple occasions; beatings and gang rapes.", source: casey() },
  { report: "Casey audit — executive summary", quote: "there is enough evidence available in local police data in three police force areas which we examined which show disproportionate numbers of men from Asian ethnic backgrounds amongst suspects for group-based child sexual exploitation", source: casey() },
  { report: "Casey audit — foreword", quote: "The appalling lack of data on ethnicity in crime recording alone is a major failing over the last decade or more.", source: casey() },
  { report: "Casey audit — executive summary", quote: "flawed data is used repeatedly to dismiss claims about ‘Asian grooming gangs’ as sensationalised, biased or untrue. This does a disservice to victims and indeed all law-abiding people in Asian communities", source: casey() },
];

export type Figure = { label: string; value: string; period: string; note: string; source: Source };

export const FIGURES: Figure[] = [
  { label: "Rotherham — girls abused (estimate)", value: "at least 1,400", period: "1997–2013", note: "The Jay report's own estimate, not a count of convictions.", source: casey() },
  { label: "Telford — children who may have been exploited (estimate)", value: "up to 1,000", period: "1989–2017", note: "Telford Independent Inquiry's own estimate.", source: casey() },
  { label: "Oxfordshire — possible child victims (estimate)", value: "as many as 373", period: "to 2015", note: "Oxfordshire serious case review's own estimate.", source: casey() },
  { label: "National inquiry funding", value: "£65 million", period: "3-year inquiry", note: "Government commitment.", source: STATUS.sources[0] },
];
// No official body publishes a national count of grooming-gang victims, perpetrators
// or convictions: the Casey audit says national ethnicity data is poor. Shown as "Not published".
export const NOT_PUBLISHED = ["National number of victims", "National number of perpetrators by ethnicity", "National conviction total for group-based exploitation"];

export type Recommendation = { n: number; text: string; position: "accepted" | "in progress" | "not stated"; source: Source };

const accepted = STATUS.sources[0];
export const RECOMMENDATIONS: Recommendation[] = [
  "Change the law so adults who intentionally penetrate a child under 16 receive mandatory charges of rape.",
  "Launch a national police operation and a national inquiry co-ordinating targeted investigations.",
  "Review the criminal convictions of victims; quash those where victims were criminalised instead of protected.",
  "Make collection of ethnicity and nationality data mandatory for all suspects in child sexual abuse and exploitation cases.",
  "Enforce mandatory information sharing between statutory safeguarding partners.",
  "Introduce unique reference numbers for children (Department for Education).",
  "Upgrade police information systems to use children's unique reference numbers.",
  "Approach child sexual exploitation investigations like serious and organised crime.",
  "Interrogate child protection data on the decline in recorded child sexual abuse and exploitation.",
  "Commission research into the drivers of group-based exploitation, including online offending and cultural factors.",
  "Stop 'out of area' taxis and bring in tougher statutory taxi licensing standards.",
  "Fully resource implementation over multiple years and report regularly to Parliament.",
].map((text, i) => ({ n: i + 1, text, position: i === 1 ? "in progress" : "accepted", source: i === 1 ? STATUS.sources[1] : accepted }) as Recommendation);
// Government position: the Home Secretary's 9 Dec 2025 letter states "The Government is implementing
// every recommendation set out by Baroness Casey". Recommendation 2's inquiry is under way.

export type LocalInquiry = { area: string; status: string; url: string };
export const LOCAL: LocalInquiry[] = [
  { area: "Oldham", status: "Local investigation by the national inquiry (first wave)", url: INQUIRY_HOME },
  { area: "Bradford and Keighley", status: "Local investigation by the national inquiry (first wave)", url: INQUIRY_HOME },
  { area: "London", status: "Local investigation by the national inquiry (first wave)", url: INQUIRY_HOME },
  { area: "Birmingham", status: "Local investigation by the national inquiry (first wave)", url: INQUIRY_HOME },
  { area: "Rotherham", status: "Jay report published 2014", url: CASEY_ACC },
  { area: "Telford", status: "Independent inquiry published July 2022", url: CASEY_ACC },
  { area: "Oxfordshire", status: "Serious case review published 2015", url: CASEY_ACC },
];

export const SUPPORT = [
  { name: "Emergency — Police", detail: "Call 999 if a child is in danger now; 101 for non-emergencies", url: "https://www.police.uk/" },
  { name: "NSPCC helpline", detail: "0808 800 5000 — advice if you're worried about a child", url: "https://www.nspcc.org.uk/keeping-children-safe/reporting-abuse/" },
  { name: "Rape Crisis England & Wales", detail: "24/7 support line 0808 500 2222", url: "https://rapecrisis.org.uk/" },
  { name: "NAPAC", detail: "Support for adults abused as children — 0808 801 0331", url: "https://napac.org.uk/" },
  { name: "Victim Support", detail: "Free 24/7 supportline 08 08 16 89 111", url: "https://www.victimsupport.org.uk/" },
];
