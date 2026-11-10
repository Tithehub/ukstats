import { ExternalLink } from "lucide-react";
import billImg from "@/assets/founding/bill-of-rights-1689.jpg.asset.json";
import magnaImg from "@/assets/founding/magna-carta-1297.jpg.asset.json";
import settlementImg from "@/assets/founding/act-of-settlement-1701.jpg.asset.json";

type Doc = {
  title: string;
  note: string;
  href: string;
  image?: { src: string; alt: string; credit: string; creditHref: string };
};

// Images: originals/period copies on Wikimedia Commons, licences checked 2026-11-10.
const DOCS: Doc[] = [
  {
    title: "Bill of Rights 1689", note: "Rights of Parliament and the subject", href: "https://www.legislation.gov.uk/aep/WillandMarSess2/1/2/contents",
    image: { src: billImg.url, alt: "Handwritten opening of the original Bill of Rights 1689", credit: "Original manuscript · public domain", creditHref: "https://commons.wikimedia.org/wiki/File:English_Bill_of_Rights_of_1689_(top).jpg" },
  },
  {
    title: "Magna Carta (1297)", note: "Clauses still in force in England", href: "https://www.legislation.gov.uk/aep/Edw1cc1929/25/9/contents",
    image: { src: magnaImg.url, alt: "Parchment of a 1297 exemplification of Magna Carta", credit: "1297 copy, Parliament House Canberra · public domain", creditHref: "https://commons.wikimedia.org/wiki/File:Magna_Carta_(1297_Australian_copy).jpg" },
  },
  { title: "Claim of Right 1689", note: "Scotland's equivalent", href: "https://www.legislation.gov.uk/aosp/1689/28/contents" },
  {
    title: "Act of Settlement 1701", note: "Succession and judicial independence", href: "https://www.legislation.gov.uk/aep/Will3/12-13/2/contents",
    image: { src: settlementImg.url, alt: "Illuminated engrossed copy of the Act of Settlement 1701", credit: "Copy presented to Electress Sophia · CC BY-SA 3.0", creditHref: "https://commons.wikimedia.org/wiki/File:Act_of_Settlement_3323.jpg" },
  },
];

/** Official legal texts from legislation.gov.uk — links only, not statistics. */
export function FoundingDocuments() {
  return (
    <section aria-label="Founding documents" className="mt-8 rounded-2xl border border-border bg-card p-5">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Official legal text · not statistics</p>
      <h2 className="mt-2 text-2xl font-black leading-tight">Our founding documents</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        The UK has no single written constitution. These are the official texts at its core, published by The National Archives on legislation.gov.uk.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {DOCS.map((d) => (
          <li key={d.href} className="flex flex-col overflow-hidden rounded-lg border border-border hover:border-primary">
            <a href={d.href} target="_blank" rel="noopener noreferrer" className="flex flex-1 flex-col">
              {d.image ? (
                <img src={d.image.src} alt={d.image.alt} width={800} height={600} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-primary p-4 text-center">
                  <span className="text-lg font-black text-primary-foreground">{d.title}</span>
                </div>
              )}
              <span className="flex flex-col p-3">
                <span className="flex items-center gap-1.5 font-bold">{d.title} <ExternalLink className="size-4 shrink-0" /></span>
                <span className="mt-1 text-xs text-muted-foreground">{d.note}</span>
              </span>
            </a>
            <p className="px-3 pb-2 text-[10px] text-muted-foreground">
              {d.image ? (
                <a href={d.image.creditHref} target="_blank" rel="noopener noreferrer" className="underline">Image: {d.image.credit}</a>
              ) : (
                "No openly licensed image of the original found"
              )}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
