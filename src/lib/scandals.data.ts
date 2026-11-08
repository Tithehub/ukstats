// Dated snapshot of official records on major public scandals, plus clearly labelled
// news headlines and YouTube links. Summaries are worded as what an official body
// found, ruled or published — never as UKStats' own conclusion. Links checked 2026-11-08.
// Never add a figure that is not in a linked official document.

export const SCANDALS_CHECKED = "2026-11-08T15:30:00Z";

export type OfficialSource = { publisher: string; title: string; url: string; published?: string };
export type Headline = { outlet: string; title: string; url: string; published: string };
export type Video = { id: string; channel: string; title: string; official?: boolean };

export type Scandal = {
  slug: string;
  title: string;
  region: "UK" | "US" | "UK and US" | "International";
  summary: string;
  status: string;
  official: OfficialSource[];
  headlines: Headline[];
  videos: Video[];
  related?: { label: string; to: "/grooming-gangs-inquiry" | "/small-boats" };
};

export const SCANDALS: Scandal[] = [
  {
    slug: "grooming-gangs",
    title: "Grooming gangs",
    region: "UK",
    summary: "Group-based child sexual exploitation in towns across England. Baroness Casey's national audit was published by the Home Office on 16 June 2025, and the government then announced a statutory national inquiry under the Inquiries Act 2005.",
    status: "Statutory national inquiry under way",
    official: [
      { publisher: "Home Office (Baroness Casey)", title: "National Audit on Group-based Child Sexual Exploitation and Abuse", url: "https://www.gov.uk/government/publications/national-audit-on-group-based-child-sexual-exploitation-and-abuse", published: "2025-06-16" },
      { publisher: "Home Office", title: "Independent Inquiry into Grooming Gangs (collection)", url: "https://www.gov.uk/government/collections/independent-inquiry-into-grooming-gangs", published: "2026-03-31" },
      { publisher: "The Inquiry", title: "About the Inquiry", url: "https://www.grooming-gangs.independent-inquiry.uk/about-the-inquiry/" },
    ],
    headlines: [],
    videos: [
      { id: "7ja5XPMJNUA", channel: "Guardian News", title: "Yvette Cooper tells MPs Louise Casey's grooming gangs audit 'damning'" },
      { id: "vOQxikSjcxw", channel: "Guardian News", title: "Casey tells public to 'keep calm' over ethnicity of offenders after grooming gangs report" },
    ],
    related: { label: "Full grooming gangs inquiry page", to: "/grooming-gangs-inquiry" },
  },
  {
    slug: "post-office-horizon",
    title: "Post Office Horizon",
    region: "UK",
    summary: "Hundreds of sub-postmasters were prosecuted over shortfalls shown by the Horizon IT system. The Court of Appeal quashed convictions in 2021, Parliament passed the Post Office (Horizon System) Offences Act 2024, and the statutory inquiry chaired by Sir Wyn Williams published Volume 1 of its final report on 8 July 2025.",
    status: "Inquiry final report being published in volumes",
    official: [
      { publisher: "Post Office Horizon IT Inquiry", title: "Chair calls for swift action to deliver full and fair compensation in urgent report (Volume 1)", url: "https://www.postofficehorizoninquiry.org.uk/news/chair-calls-swift-action-deliver-full-and-fair-compensation-urgent-report", published: "2025-07-08" },
      { publisher: "Post Office Horizon IT Inquiry", title: "Inquiry website — hearings, evidence and reports", url: "https://www.postofficehorizoninquiry.org.uk/" },
      { publisher: "legislation.gov.uk", title: "Post Office (Horizon System) Offences Act 2024", url: "https://www.legislation.gov.uk/ukpga/2024/14/contents", published: "2024-05-24" },
      { publisher: "Court of Appeal (BAILII)", title: "Hamilton & Ors v Post Office Ltd [2021] EWCA Crim 577", url: "https://www.bailii.org/ew/cases/EWCA/Crim/2021/577.html", published: "2021-04-23" },
    ],
    headlines: [
      { outlet: "BBC News", title: "Post Office scandal had 'disastrous' impact on victims, report says", url: "https://www.bbc.co.uk/news/articles/cz9k4lvg77lo", published: "2025-07-08" },
    ],
    videos: [
      { id: "V7uLWd_s3jM", channel: "Post Office Horizon IT Inquiry", title: "Closing Statements - Day 200 PM - 17 December 2024 - Post Office Horizon IT Inquiry", official: true },
      { id: "hBJm9ZYqL10", channel: "Computerphile", title: "Post Office Horizon Scandal - Computerphile" },
    ],
  },
  {
    slug: "epstein-files",
    title: "Epstein files",
    region: "US",
    summary: "Jeffrey Epstein, a convicted sex offender, died in federal custody in August 2019; Ghislaine Maxwell was convicted of sex trafficking in December 2021. Congress passed the Epstein Files Transparency Act, and the US Justice Department has published records in batches since December 2025. Being named in the files is not evidence of wrongdoing.",
    status: "Records released in batches by the US Justice Department",
    official: [
      { publisher: "US Department of Justice", title: "Epstein library — released records", url: "https://www.justice.gov/epstein" },
      { publisher: "Congress.gov", title: "H.R.4405 — Epstein Files Transparency Act", url: "https://www.congress.gov/bill/119th-congress/house-bill/4405" },
      { publisher: "House Committee on Oversight", title: "Committee website — Epstein investigation releases", url: "https://oversight.house.gov/" },
    ],
    headlines: [
      { outlet: "Reuters", title: "Trump flew on Epstein jet eight times in the '90s, according to prosecutor email", url: "https://www.reuters.com/world/us/us-justice-department-releases-new-tranche-epstein-files-2025-12-23/", published: "2025-12-23" },
      { outlet: "Reuters", title: "Commerce Secretary Lutnick planned lunch on Epstein's island, new release shows", url: "https://www.reuters.com/world/us/trumps-justice-department-releases-new-cache-jeffrey-epstein-files-2026-01-30/", published: "2026-01-30" },
      { outlet: "Reuters", title: "Justice Department releases missing FBI interviews in Epstein files with woman who made claims against Trump", url: "https://www.reuters.com/world/us/justice-department-releases-missing-fbi-interviews-epstein-files-with-woman-who-2026-03-06/", published: "2026-03-06" },
    ],
    videos: [
      { id: "8f5RFHmtRic", channel: "FRANCE 24 English", title: "Unweaving Jeffrey Epstein’s web: What the files have revealed • FRANCE 24 English" },
      { id: "uTsI2OTeSxk", channel: "The New York Times", title: "The Truth About Jeffrey Epstein’s Death" },
    ],
  },
  {
    slug: "jimmy-savile",
    title: "Jimmy Savile",
    region: "UK",
    summary: "After Savile's death in 2011, police and NHS investigations found he had abused people over decades, including in hospitals. The BBC-commissioned Dame Janet Smith Review was published on 25 February 2016; the government's NHS 'lessons learned' report (Kate Lampard) was published in February 2015.",
    status: "Reviews completed",
    official: [
      { publisher: "Department of Health", title: "Jimmy Savile NHS investigations: lessons learned (Lampard report)", url: "https://www.gov.uk/government/publications/jimmy-savile-nhs-investigations-lessons-learned", published: "2015-02-26" },
      { publisher: "BBC Trust", title: "Publication of the Dame Janet Smith review", url: "https://www.bbc.co.uk/bbctrust/news/press_releases/2016/dame_janet_smith.html", published: "2016-02-25" },
      { publisher: "BBC Trust (Dame Janet Smith)", title: "The Dame Janet Smith Review Report, Volume 1 (PDF)", url: "https://downloads.bbci.co.uk/bbctrust/assets/files/pdf/our_work/dame_janet_smith_review/conclusions_summaries.pdf", published: "2016-02-25" },
    ],
    headlines: [],
    videos: [
      { id: "Y8FHb08pc44", channel: "Sky News", title: "Dame Janet Smith Delivers Savile Report Findings" },
    ],
  },
  {
    slug: "bbc-trump-edit",
    title: "BBC Panorama Trump edit",
    region: "UK and US",
    summary: "A 2024 Panorama programme joined two parts of a Donald Trump speech from 6 January 2021. After a leaked internal memo was reported, BBC director general Tim Davie and News CEO Deborah Turness resigned on 9 November 2025, and the BBC apologised for the edit.",
    status: "Resignations and BBC apology; further scrutiny by Parliament",
    official: [
      { publisher: "BBC Media Centre", title: "BBC statements", url: "https://www.bbc.co.uk/mediacentre" },
      { publisher: "UK Parliament", title: "Culture, Media and Sport Committee", url: "https://committees.parliament.uk/committee/378/culture-media-and-sport-committee/" },
    ],
    headlines: [
      { outlet: "BBC News", title: "BBC director general Tim Davie and News CEO Deborah Turness resign over Trump documentary edit", url: "https://www.bbc.com/news/articles/c3vn25d5dq7o", published: "2025-11-09" },
      { outlet: "Reuters", title: "BBC boss and head of news quit after criticism of Trump documentary edit", url: "https://www.reuters.com/business/media-telecom/britains-bbc-boss-tim-davie-resigns-following-criticism-over-trump-documentary-2025-11-09/", published: "2025-11-10" },
      { outlet: "The Guardian", title: "BBC in crisis: why did Tim Davie and Deborah Turness resign?", url: "https://www.theguardian.com/media/2025/nov/09/why-is-the-bbc-expected-to-apologise-over-a-donald-trump-speech-edit", published: "2025-11-10" },
    ],
    videos: [
      { id: "EczqWXF_ch0", channel: "BBC News", title: "BBC director general Tim Davie resigns over Trump documentary edit | BBC News" },
      { id: "tbByq5jWg_I", channel: "Associated Press", title: "Top BBC bosses resign after criticism around the editing of a Trump speech" },
    ],
  },
  {
    slug: "princess-diana",
    title: "Princess Diana",
    region: "UK",
    summary: "Diana, Princess of Wales died in a car crash in Paris on 31 August 1997. The Metropolitan Police's Operation Paget reported in December 2006. On 7 April 2008 the inquest jury returned a verdict of unlawful killing, caused by the grossly negligent driving of the car's driver and of the following vehicles.",
    status: "Inquest concluded 2008",
    official: [
      { publisher: "The National Archives (web archive)", title: "Inquests into the deaths of Diana, Princess of Wales and Mr Dodi Al Fayed", url: "https://webarchive.nationalarchives.gov.uk/ukgwa/20080521114419/http://www.scottbaker-inquests.gov.uk/", published: "2008-04-07" },
    ],
    headlines: [],
    videos: [
      { id: "YTbrVd31FSM", channel: "The Courtroom", title: "Princess Diana Death Timeline: What the Inquest and Operation Paget Found" },
    ],
  },
  {
    slug: "covid-vaccines",
    title: "COVID-19 and vaccines",
    region: "UK",
    summary: "The UK Covid-19 Inquiry, chaired by Baroness Hallett, is publishing reports by module. Its second report (Module 2, 20 November 2025) found the response of the four UK governments was often 'too little, too late'. Vaccine safety reports are published by the MHRA, and the government runs the Vaccine Damage Payment scheme.",
    status: "Inquiry ongoing; reports published by module",
    official: [
      { publisher: "UK Covid-19 Inquiry", title: "Inquiry publishes second report and 19 recommendations (Module 2)", url: "https://covid19.public-inquiry.uk/news/inquiry-publishes-second-report-and-19-recommendations-examining-core-uk-decision-making-and-political-governance/", published: "2025-11-20" },
      { publisher: "UK Covid-19 Inquiry", title: "Inquiry website — modules and reports", url: "https://covid19.public-inquiry.uk/" },
      { publisher: "MHRA", title: "Yellow Card — report side effects", url: "https://yellowcard.mhra.gov.uk/" },
      { publisher: "GOV.UK", title: "Vaccine Damage Payment", url: "https://www.gov.uk/vaccine-damage-payment" },
    ],
    headlines: [
      { outlet: "BBC News", title: "Covid inquiry: UK did 'too little, too late', leading to thousands more deaths", url: "https://www.bbc.co.uk/news/articles/c8030xvvlv0o", published: "2025-11-20" },
      { outlet: "The Guardian", title: "‘Chaotic and indecisive’: key findings of report on UK’s Covid response under Tories", url: "https://www.theguardian.com/world/2025/nov/20/chaotic-and-indecisive-key-findings-of-report-on-uks-covid-response-under-tories", published: "2025-11-20" },
    ],
    videos: [
      { id: "Gbf8-ODNOYE", channel: "UK Covid-19 Inquiry", title: "Statement by the Chair on the Module 1 Report: Resilience and preparedness of the United Kingdom", official: true },
      { id: "2sZAdMnYj54", channel: "UK Covid-19 Inquiry", title: "Module 1 Report - Animated Summary", official: true },
    ],
  },
  {
    slug: "ufo-disclosure",
    title: "UFOs and disclosure",
    region: "UK and US",
    summary: "The Ministry of Defence released its UFO files to The National Archives between 2008 and 2013. In the US, the Pentagon's All-domain Anomaly Resolution Office (AARO) published Volume 1 of its historical record report on 8 March 2024, saying it found no verifiable evidence of extraterrestrial activity; Congress has held public hearings.",
    status: "Files released; US reviews continuing",
    official: [
      { publisher: "The National Archives", title: "UFOs — MoD files", url: "https://www.nationalarchives.gov.uk/ufos/" },
      { publisher: "AARO (US Department of Defense)", title: "All-domain Anomaly Resolution Office", url: "https://www.aaro.mil/" },
      { publisher: "US Department of Defense", title: "DOD Report Discounts Sightings of Extraterrestrial Technology", url: "https://www.war.gov/News/News-Stories/Article/Article/3701297/dod-report-discounts-sightings-of-extraterrestrial-technology/", published: "2024-03-08" },
    ],
    headlines: [
      { outlet: "Reuters", title: "Pentagon UFO report says most sightings 'ordinary objects' and phenomena", url: "https://www.reuters.com/technology/space/pentagon-ufo-report-says-most-sightings-ordinary-objects-phenomena-2024-03-08/", published: "2024-03-08" },
    ],
    videos: [
      { id: "Glw76YKuWCY", channel: "PBS NewsHour", title: "WATCH LIVE: UFO congressional hearing explores unexplained aerial phenomena" },
    ],
  },
  {
    slug: "iraq-war",
    title: "Iraq war",
    region: "UK",
    summary: "The UK joined the US-led invasion of Iraq in March 2003. The Iraq Inquiry chaired by Sir John Chilcot reported on 6 July 2016, finding the UK chose to join before peaceful options had been exhausted and that judgements about Iraq's weapons were presented with a certainty that was not justified.",
    status: "Inquiry reported 2016",
    official: [
      { publisher: "GOV.UK", title: "The Report of the Iraq Inquiry", url: "https://www.gov.uk/government/publications/the-report-of-the-iraq-inquiry", published: "2016-07-06" },
      { publisher: "The National Archives (web archive)", title: "The Iraq Inquiry website", url: "https://webarchive.nationalarchives.gov.uk/ukgwa/20171123123237/http://www.iraqinquiry.org.uk/" },
    ],
    headlines: [],
    videos: [
      { id: "upj9qJXlGSI", channel: "Channel 4 News", title: "Chilcot inquiry: the report and the regrets" },
      { id: "gU8KHW93OA4", channel: "CNBC", title: "Chilcot Inquiry: 8 Key Points | CNBC" },
    ],
  },
  {
    slug: "iran-war",
    title: "Iran war",
    region: "International",
    summary: "The US and Israel struck Iran at the end of February 2026 and Iran fired missiles and drones across the region. UK ministers have set out the government's position, including defensive military support and the use of UK bases, in statements to Parliament.",
    status: "Conflict ongoing — see official travel advice",
    official: [
      { publisher: "Ministry of Defence (John Healey MP)", title: "Middle East Update Oral Statement", url: "https://www.gov.uk/government/speeches/middle-east-update-oral-statement", published: "2026-03-09" },
      { publisher: "FCDO (Yvette Cooper MP)", title: "Foreign Secretary statement on the Middle East conflict: 17 March", url: "https://www.gov.uk/government/speeches/foreign-secretary-statement-on-the-middle-east-conflict-17-march", published: "2026-03-17" },
      { publisher: "FCDO", title: "Foreign travel advice: Iran", url: "https://www.gov.uk/foreign-travel-advice/iran" },
    ],
    headlines: [
      { outlet: "BBC News", title: "Starmer criticises Trump over Iran strikes, as he defends UK position", url: "https://www.bbc.co.uk/news/articles/cj0dnq2v0e2o", published: "2026-03-02" },
    ],
    videos: [
      { id: "td5Iph8BFgE", channel: "FRONTLINE PBS", title: "Strike on Iran: The Nuclear Question (updated documentary) | FRONTLINE (PBS)" },
    ],
  },
  {
    slug: "falklands",
    title: "Falklands war",
    region: "UK",
    summary: "Argentina invaded the Falkland Islands on 2 April 1982; British forces retook them and Argentina surrendered on 14 June 1982. The Franks Committee reviewed the government's handling before the invasion and reported in January 1983. Government papers are released through The National Archives.",
    status: "Historic — papers released by The National Archives",
    official: [
      { publisher: "The National Archives", title: "The Falkland Islands Review Committee: The Franks Report: Files", url: "https://discovery.nationalarchives.gov.uk/details/record?catid=69947&catln=3" },
      { publisher: "UK Parliament (Hansard)", title: "Hansard — debates on the Falkland Islands", url: "https://hansard.parliament.uk/search?searchTerm=Falkland%20Islands%201982" },
    ],
    headlines: [],
    videos: [
      { id: "KS4mTxlsYSM", channel: "BBC News", title: "The Falklands War: 40 years on" },
    ],
  },
  {
    slug: "bill-clinton",
    title: "Bill Clinton",
    region: "US",
    summary: "The Starr Report was sent to Congress in September 1998; the House impeached President Clinton in December 1998 and the Senate acquitted him in February 1999. In February 2026 he gave a deposition to the House Oversight Committee's Epstein investigation, telling it he 'saw nothing' and 'did nothing wrong'.",
    status: "Impeachment concluded 1999; Epstein deposition released 2026",
    official: [
      { publisher: "US Government Publishing Office", title: "Referral from Independent Counsel Kenneth W. Starr (House Document 105-310)", url: "https://www.govinfo.gov/content/pkg/GPO-CDOC-105hdoc310/pdf/GPO-CDOC-105hdoc310.pdf", published: "1998-09-11" },
      { publisher: "US Senate", title: "Roll call vote 17 — Article I, Articles of Impeachment v. President W. J. Clinton (Not Guilty)", url: "https://www.senate.gov/legislative/LIS/roll_call_votes/vote1061/vote_106_1_00017.htm", published: "1999-02-12" },
      { publisher: "House Committee on Oversight", title: "Committee website — Epstein investigation releases", url: "https://oversight.house.gov/" },
    ],
    headlines: [
      { outlet: "NBC News", title: "Bill Clinton says in Epstein probe he 'saw nothing' and 'did nothing wrong'", url: "https://www.nbcnews.com/politics/congress/bill-clinton-house-epstein-probe-rare-testimony-former-president-rcna260436", published: "2026-02-27" },
      { outlet: "POLITICO", title: "The biggest revelations from Bill Clinton’s deposition on Epstein", url: "https://www.politico.com/news/2026/03/02/bill-clinton-hillary-clinton-epstein-depositions-00807354", published: "2026-03-02" },
    ],
    videos: [
      { id: "KM-PDRq9gOc", channel: "PBS NewsHour", title: "WATCH: Bill Clinton's full deposition on Jeffrey Epstein ties before House Oversight panel" },
    ],
  },
  {
    slug: "boat-crossings",
    title: "UK small boat crossings",
    region: "UK",
    summary: "People crossing the English Channel in small boats are counted and published by the Home Office. Our Small boats page shows the latest official figures with their source and date.",
    status: "Ongoing — figures published by the Home Office",
    official: [
      { publisher: "Home Office", title: "Migrants detected crossing the English Channel in small boats", url: "https://www.gov.uk/government/publications/migrants-detected-crossing-the-english-channel-in-small-boats" },
    ],
    headlines: [],
    videos: [
      { id: "EGSejQQ-alQ", channel: "ITV News", title: "Home Secretary orders review after two small boats cross the channel without being intercepted" },
    ],
    related: { label: "Latest official small boats figures", to: "/small-boats" },
  },
  {
    slug: "jury-trials-curbed",
    title: "The end of jury trials? Lammy's Crown Court reforms",
    region: "UK",
    summary: "Sir Brian Leveson's Independent Review of the Criminal Courts (Part 1, July 2025) proposed new ways of trying cases to cut the Crown Court backlog. On 2 December 2025 the Ministry of Justice announced that many cases in England and Wales likely to get a sentence of three years or less would be heard without a jury. The Courts and Tribunals Bill now before Parliament carries the changes.",
    status: "Courts and Tribunals Bill before Parliament",
    official: [
      { publisher: "Ministry of Justice (Sir Brian Leveson)", title: "Independent Review of the Criminal Courts: Part 1", url: "https://www.gov.uk/government/publications/independent-review-of-the-criminal-courts-part-1", published: "2025-07-09" },
      { publisher: "Ministry of Justice (Sir Brian Leveson)", title: "Independent Review of the Criminal Courts: Part 2", url: "https://www.gov.uk/government/publications/independent-review-of-the-criminal-courts-part-2", published: "2026-02-04" },
      { publisher: "Ministry of Justice", title: "'Swift and fair' plan to get justice for victims", url: "https://www.gov.uk/government/news/swift-and-fair-plan-to-get-justice-for-victims", published: "2025-12-02" },
      { publisher: "UK Parliament", title: "Written statement HCWS1123 — criminal courts reform", url: "https://questions-statements.parliament.uk/written-statements/detail/2025-12-02/hcws1123", published: "2025-12-02" },
      { publisher: "UK Parliament", title: "Courts and Tribunals Bill — bill stages and documents", url: "https://bills.parliament.uk/bills/4083" },
      { publisher: "House of Commons Library", title: "Courts and Tribunals Bill 2024-26 (research briefing CBP-10515)", url: "https://commonslibrary.parliament.uk/research-briefings/cbp-10515/", published: "2026-03-06" },
      { publisher: "Ministry of Justice", title: "Government Response to the Independent Review of the Criminal Courts", url: "https://www.gov.uk/government/publications/government-response-to-the-independent-review-of-the-criminal-courts/government-response-to-the-independent-review-of-the-criminal-courts", published: "2026-10-12" },
    ],
    headlines: [
      { outlet: "BBC News", title: "Jury trials scrapped for crimes with sentences of less than three years", url: "https://www.bbc.co.uk/news/articles/cn5lxg2l0lqo", published: "2025-12-02" },
      { outlet: "Sky News", title: "Jury trials will be scrapped for defendants facing sentences of three years or less, David Lammy announces", url: "https://news.sky.com/story/no-jury-trials-for-sentences-likely-to-be-three-years-or-less-13478282", published: "2025-12-02" },
      { outlet: "BBC News", title: "Jury restriction plan clears first hurdle despite Labour dissent", url: "https://www.bbc.co.uk/news/articles/cpw0eg9q7kwo", published: "2026-03-10" },
      { outlet: "Morning Star", title: "Lawyers protest outside Parliament against plans to scrap the right to a jury trial", url: "https://www.morningstaronline.co.uk/article/lawyers-protest-outside-parliament-against-plans-scrap-right-jury-trial", published: "2026-10-13" },
    ],
    videos: [],
  },
  {
    slug: "dei-jason-arday",
    title: "DEI on trial: the Jason Arday affair at Cambridge",
    region: "UK",
    summary: "In August 2026 the University of Cambridge said it had begun an investigation into new information about Professor Jason Arday's academic qualifications and honorary appointments, alongside separate academic-misconduct complaints. He resigned, and his death was reported on 14 August 2026. The case set off a national debate about diversity, equity and inclusion (DEI) in university hiring. Cambridge has commissioned an independent review in two parts; Part Two is led by Jason Beer KC. The allegations were not tested to a conclusion.",
    status: "Independent review commissioned by Cambridge under way",
    official: [
      { publisher: "University of Cambridge", title: "Statement about Professor Arday", url: "https://www.cam.ac.uk/notices/news/statement-about-professor-arday", published: "2026-08-05" },
      { publisher: "University of Cambridge", title: "Statement to the Cambridge community", url: "https://www.cam.ac.uk/notices/news/statement-to-the-cambridge-community", published: "2026-08-14" },
      { publisher: "University of Cambridge", title: "University of Cambridge launches independent review following the death of Professor Jason Arday", url: "https://www.cam.ac.uk/news/university-of-cambridge-launches-independent-review-following-the-death-of-professor-jason-arday", published: "2026-09-04" },
      { publisher: "University of Cambridge", title: "Nazir Afzal OBE launches part one of the independent review", url: "https://www.cam.ac.uk/news/nazir-afzal-obe-launches-part-one-of-the-independent-review-following-the-death-of-professor-jason", published: "2026-09-14" },
      { publisher: "University of Cambridge", title: "Jason Beer KC appointed to conduct Part Two of Independent Review", url: "https://www.cam.ac.uk/news/jason-beer-kc-appointed-to-conduct-part-two-of-independent-review-following-the-death-of-professor", published: "2026-11-04" },
      { publisher: "legislation.gov.uk", title: "Equality Act 2010", url: "https://www.legislation.gov.uk/ukpga/2010/15/contents", published: "2010-04-08" },
    ],
    headlines: [
      { outlet: "The Telegraph", title: "The Cambridge diversity scramble that led to Jason Arday plagiarism fiasco", url: "https://www.telegraph.co.uk/news/2026/08/06/the-cambridge-diversity-scramble-that-led-to-arday-fiasco/", published: "2026-08-06" },
      { outlet: "The Guardian", title: "The rise and fall of Jason Arday: a full rundown of the questions being asked", url: "https://www.theguardian.com/uk-news/2026/aug/06/rise-and-fall-of-jason-arday", published: "2026-08-06" },
      { outlet: "Reuters", title: "Jason Arday, ex-Cambridge professor at centre of plagiarism scandal, found dead", url: "https://www.reuters.com/world/uk/ex-cambridge-professor-centre-plagiarism-scandal-found-dead-british-media-report-2026-08-14/", published: "2026-08-14" },
      { outlet: "AP News", title: "Jason Arday's death sparks UK debate over academic rigor, racism", url: "https://apnews.com/article/jason-arday-cambridge-black-professor-ec1d14a8e40a74e16ab5a0363f7dc623", published: "2026-08-19" },
      { outlet: "The Guardian", title: "Cambridge asks Post Office inquiry barrister to lead review into death of Jason Arday", url: "https://www.theguardian.com/uk-news/2026/nov/04/cambridge-university-asks-barrister-to-lead-jason-arday-review", published: "2026-11-04" },
    ],
    videos: [],
  },
];
