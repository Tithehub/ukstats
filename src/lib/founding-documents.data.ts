// Plain-English histories of the UK's founding documents, earliest to latest.
// Rule: a change is only called unlawful where a court or official source says so (quoted, linked).
// Links checked 2026-11-10.

export type TimelineEntry = { year: string; title: string; text: string; sourceHref: string; sourceLabel: string };
export type FoundingHistory = { id: string; title: string; summary: string; inForce: string; timeline: TimelineEntry[] };

const LEG = "legislation.gov.uk";

export const HISTORY_CHECKED = "10 November 2026";

export const FOUNDING_HISTORIES: FoundingHistory[] = [
  {
    id: "magna-carta",
    title: "Magna Carta",
    summary: "A charter first agreed between King John and his barons in 1215, later reissued and confirmed as statute in 1297.",
    inForce: "Three clauses remain in force in England and Wales: clause 1 (freedom of the English Church), clause 9 (the liberties of the City of London and other towns) and clause 29 (no free man to be imprisoned or punished except by lawful judgment or the law of the land).",
    timeline: [
      { year: "1215", title: "Sealed at Runnymede", text: "King John agrees the charter with rebel barons. It is annulled by the Pope within months and civil war follows.", sourceHref: "https://www.parliament.uk/about/living-heritage/evolutionofparliament/originsofparliament/birthofparliament/overview/magnacarta/", sourceLabel: "UK Parliament" },
      { year: "1216–1225", title: "Reissued under Henry III", text: "Revised versions are issued in 1216, 1217 and 1225. The 1225 text becomes the basis of later confirmations.", sourceHref: "https://www.parliament.uk/about/living-heritage/evolutionofparliament/originsofparliament/birthofparliament/overview/magnacarta/", sourceLabel: "UK Parliament" },
      { year: "1297", title: "Confirmed as statute by Edward I", text: "Entered on the statute roll. This 1297 version is the one published today as law on legislation.gov.uk.", sourceHref: "https://www.legislation.gov.uk/aep/Edw1cc1929/25/9/contents", sourceLabel: LEG },
      { year: "1800s–1969", title: "Most clauses repealed by Parliament", text: "Clauses are repealed in stages by later Acts as they become obsolete, the last major round being the Statute Law (Repeals) Act 1969. Each repeal was made by Act of Parliament.", sourceHref: "https://www.legislation.gov.uk/ukpga/1969/52/contents", sourceLabel: LEG },
      { year: "Today", title: "Three clauses still in force", text: "Clauses 1, 9 and 29 remain on the statute book.", sourceHref: "https://www.legislation.gov.uk/aep/Edw1cc1929/25/9/contents", sourceLabel: LEG },
    ],
  },
  {
    id: "bill-of-rights",
    title: "Bill of Rights 1689",
    summary: "The English Act that set limits on the Crown after James II left the throne, and settled it on William III and Mary II.",
    inForce: "Still in force. Article 9 (freedom of speech and debates in Parliament) remains central to parliamentary privilege.",
    timeline: [
      { year: "1689 (Feb)", title: "Declaration of Right", text: "The Convention Parliament presents a Declaration of Right to William and Mary as they accept the Crown.", sourceHref: "https://www.parliament.uk/about/living-heritage/evolutionofparliament/parliamentaryauthority/revolution/collections1/collections-glorious-revolution/billofrights/", sourceLabel: "UK Parliament" },
      { year: "1689 (Dec)", title: "Enacted as the Bill of Rights", text: "Lists rights including no taxation or standing army in peacetime without Parliament's consent, free elections, and freedom of speech in Parliament (Article 9).", sourceHref: "https://www.legislation.gov.uk/aep/WillandMarSess2/1/2/contents", sourceLabel: LEG },
      { year: "2010", title: "R v Chaytor (Supreme Court)", text: "The court rules that Article 9 does not protect MPs' expenses claims from prosecution, as submitting claims is not a 'proceeding in Parliament'.", sourceHref: "https://www.supremecourt.uk/cases/uksc-2010-0195", sourceLabel: "UK Supreme Court" },
      { year: "2019", title: "Miller/Cherry: prorogation case", text: "The Supreme Court holds that prorogation was not a 'proceeding in Parliament' under Article 9, and rules: \"the Prime Minister's advice to Her Majesty was unlawful\".", sourceHref: "https://www.supremecourt.uk/cases/uksc-2019-0192", sourceLabel: "UK Supreme Court" },
    ],
  },
  {
    id: "claim-of-right",
    title: "Claim of Right 1689",
    summary: "The Scottish Act by which the Convention of Estates declared that James VII had forfeited the Scottish throne and offered it to William and Mary.",
    inForce: "Still in force in Scotland.",
    timeline: [
      { year: "1689 (Apr)", title: "Adopted by the Scottish Convention", text: "Declares James VII forfeited the Crown and sets out grievances, including that the Crown may not override the law.", sourceHref: "https://www.legislation.gov.uk/aosp/1689/28/contents", sourceLabel: LEG },
      { year: "1707", title: "Union with England", text: "The Scottish Parliament's Union with England Act joins the two kingdoms; the Claim of Right remains part of Scots law.", sourceHref: "https://www.legislation.gov.uk/aosp/1707/7/contents", sourceLabel: LEG },
      { year: "2019", title: "Cherry case joined with Miller", text: "The Scottish prorogation challenge (Cherry) is heard with Miller in the Supreme Court, which rules the advice to prorogue \"was unlawful\".", sourceHref: "https://www.supremecourt.uk/cases/uksc-2019-0192", sourceLabel: "UK Supreme Court" },
    ],
  },
  {
    id: "act-of-settlement",
    title: "Act of Settlement 1701",
    summary: "The Act that settled the succession on Sophia of Hanover and her Protestant heirs, and protected judges from removal at the Crown's pleasure.",
    inForce: "Still in force, as amended. The Protestant succession rules remain; the bar on marrying a Roman Catholic was removed in 2015.",
    timeline: [
      { year: "1701", title: "Succession settled", text: "Fixes the line of succession on Sophia of Hanover and her Protestant heirs, and provides that judges serve 'during good behaviour', removable only on an address of both Houses.", sourceHref: "https://www.legislation.gov.uk/aep/Will3/12-13/2/contents", sourceLabel: LEG },
      { year: "1714", title: "George I succeeds", text: "Sophia's son George becomes King under the Act on the death of Queen Anne.", sourceHref: "https://www.royal.uk/george-i", sourceLabel: "The Royal Family" },
      { year: "2005", title: "Judicial independence put in statute", text: "The Constitutional Reform Act 2005 places a legal duty on ministers to uphold the independence of the judiciary.", sourceHref: "https://www.legislation.gov.uk/ukpga/2005/4/contents", sourceLabel: LEG },
      { year: "2013 (in force 2015)", title: "Succession to the Crown Act", text: "Ends male preference for those born after 28 October 2011 and removes disqualification for marrying a Roman Catholic. Made by Act of Parliament with the agreement of the other Commonwealth realms.", sourceHref: "https://www.legislation.gov.uk/ukpga/2013/20/contents", sourceLabel: LEG },
    ],
  },
];
