import type { ElectionParty, PartyTopic } from "./party-comparison";

export const ELECTION_SOURCE = "https://electionresults.parliament.uk/general-elections/6s";
export const ELECTION_DATE = "2024-07-04";
export const PARTY_EVIDENCE_CHECKED = "2026-10-18";
export const ELECTION_PARTIES: ElectionParty[] = [
  { id: "labour", name: "Labour", seats: 411, voteShare: 33.7, area: "Great Britain" },
  { id: "conservative", name: "Conservative", seats: 121, voteShare: 23.7, area: "Great Britain" },
  { id: "reform", name: "Reform UK", seats: 5, voteShare: 14.3, area: "Great Britain" },
  { id: "libdem", name: "Liberal Democrats", seats: 72, voteShare: 12.2, area: "Great Britain" },
  { id: "green", name: "Green Party", seats: 4, voteShare: 6.4, area: "England & Wales" },
  { id: "snp", name: "SNP", seats: 9, voteShare: 2.5, area: "Scotland" },
  { id: "plaid", name: "Plaid Cymru", seats: 4, voteShare: 0.7, area: "Wales" },
];

type ManifestoEvidence = { url: string; reference: string; positions: Partial<Record<PartyTopic, string>> };
/** Dated primary-document summaries: promises, never delivery scores. */
export const MANIFESTOS: Record<string, ManifestoEvidence> = {
  labour: {
    url: "https://labour.org.uk/wp-content/uploads/2024/06/Labour-Party-manifesto-2024.pdf",
    reference: "2024 general-election manifesto",
    positions: {
      immigration: "Create a Border Security Command, end the Rwanda scheme and reduce reliance on overseas recruitment through skills and training.",
      tax: "Do not increase National Insurance or the basic, higher or additional rates of income tax, or VAT. Apply VAT to private-school fees.",
      nhs: "Provide 40,000 additional appointments each week in England; use spare independent-sector capacity for NHS patients.",
      housing: "Build 1.5 million homes in England over the Parliament, with planning reform and mandatory housing targets.",
      climate: "Achieve clean power by 2030 and create publicly owned Great British Energy.",
    },
  },
  conservative: {
    url: "https://public.conservatives.com/static/documents/GE2024/Conservative-Manifesto-GE2024.pdf",
    reference: "2024 general-election manifesto",
    positions: {
      immigration: "Introduce a binding annual legal-migration cap, reduced each year; continue the Rwanda removal scheme.",
      tax: "Cut employee National Insurance further and abolish the main rate of self-employed National Insurance by the end of the Parliament.",
      nhs: "Expand the NHS workforce in England, including 92,000 more nurses and 28,000 more doctors by the end of the next Parliament.",
      housing: "Deliver 1.6 million homes in England over the Parliament, prioritising brownfield development.",
      climate: "Retain net zero by 2050 while pursuing a transition intended to limit costs to households; support new oil and gas licences.",
    },
  },
  reform: {
    url: "https://www.reformparty.uk/our-contract-contents",
    reference: "Our Contract with You · 2024 election",
    positions: {
      immigration: "Freeze non-essential immigration, leave the European Convention on Human Rights and introduce offshore processing where necessary.",
      tax: "Raise the income-tax starting threshold to £20,000 and the higher-rate threshold to £70,000.",
      nhs: "Use independent healthcare capacity and introduce NHS vouchers for private treatment when specified waiting-time thresholds are exceeded.",
      housing: "Fast-track brownfield planning, restore landlords’ finance-cost deductions and abolish the proposed Renters’ Reform Bill.",
      climate: "Scrap net-zero commitments and expand domestic oil and gas production.",
    },
  },
  libdem: {
    url: "https://www.libdems.org.uk/fileadmin/groups/2_Federal_Party/Documents/PolicyPapers/Manifesto_2024/For_a_Fair_Deal_-_Liberal_Democrat_Manifesto_2024.pdf",
    reference: "For a Fair Deal · 2024 election",
    positions: {
      immigration: "Scrap the Illegal Migration Act and Rwanda scheme; create safe routes and improve asylum processing.",
      tax: "Reform capital gains tax, reverse bank tax cuts and increase the Digital Services Tax on major technology firms.",
      nhs: "Improve GP and dentistry access, invest in staff and introduce a ten-year health and care workforce plan.",
      housing: "Build 380,000 homes a year across the UK, including 150,000 social homes.",
      climate: "Reach net zero by 2045 at the latest and invest in renewables and home insulation.",
    },
  },
  green: {
    url: "https://www.greenparty.org.uk/app/uploads/2024/06/Green-Party-2024-General-Election-Manifesto-Long-version-with-cover.pdf",
    reference: "England & Wales · 2024 election manifesto",
    positions: {
      immigration: "End the hostile environment and provide a fairer asylum and migration system.",
      tax: "Introduce a wealth tax of 1% on assets above £10 million and 2% on assets above £1 billion.",
      nhs: "Increase NHS funding, expand public provision and invest in primary care, dentistry and mental health services.",
      housing: "Provide 150,000 new social homes a year and support local-authority rent controls.",
      climate: "End new oil and gas licences; seek a zero-carbon society more than a decade ahead of 2050 and decarbonise energy before 2030.",
    },
  },
  snp: { url: "https://www.snp.org/snp-2024-manifesto-our-plan-for-real-change/", reference: "2024 manifesto · Scotland", positions: {} },
  plaid: { url: "https://www.plaid.cymru/2024", reference: "2024 Westminster manifesto · Wales", positions: {} },
};