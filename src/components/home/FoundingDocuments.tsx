import { ExternalLink, ChevronDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { FOUNDING_HISTORIES, type FoundingHistory } from "@/lib/founding-documents.data";
import { HistoryTimeline } from "./FoundingTimeline";
import billImg from "@/assets/founding/bill-of-rights-1689.jpg.asset.json";
import magnaImg from "@/assets/founding/magna-carta-1297.jpg.asset.json";
import settlementImg from "@/assets/founding/act-of-settlement-1701.jpg.asset.json";
import nrrImg from "@/assets/founding/national-risk-register-2026-cover.jpg.asset.json";

type Doc = {
  title: string;
  note: string;
  href: string;
  historyId: string;
  image?: { src: string; alt: string; credit: string; creditHref: string };
};

// Images: originals/period copies on Wikimedia Commons, licences checked 2026-11-10.
const DOCS: Doc[] = [
  {
    historyId: "bill-of-rights", title: "Bill of Rights 1689", note: "Rights of Parliament and the subject", href: "https://www.legislation.gov.uk/aep/WillandMarSess2/1/2/contents",
    image: { src: billImg.url, alt: "Handwritten opening of the original Bill of Rights 1689", credit: "Original manuscript · public domain", creditHref: "https://commons.wikimedia.org/wiki/File:English_Bill_of_Rights_of_1689_(top).jpg" },
  },
  {
    historyId: "magna-carta", title: "Magna Carta (1297)", note: "Clauses still in force in England", href: "https://www.legislation.gov.uk/aep/Edw1cc1929/25/9/contents",
    image: { src: magnaImg.url, alt: "Parchment of a 1297 exemplification of Magna Carta", credit: "1297 copy, Parliament House Canberra · public domain", creditHref: "https://commons.wikimedia.org/wiki/File:Magna_Carta_(1297_Australian_copy).jpg" },
  },
  { historyId: "claim-of-right", title: "Claim of Right 1689", note: "Scotland's equivalent", href: "https://www.legislation.gov.uk/aosp/1689/28/contents" },
  {
    historyId: "act-of-settlement", title: "Act of Settlement 1701", note: "Succession and judicial independence", href: "https://www.legislation.gov.uk/aep/Will3/12-13/2/contents",
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
      <ul className="mt-4 grid items-start gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {DOCS.map((d) => (
          <li key={d.href} className="flex h-full items-start gap-3 rounded-lg border border-border p-3 hover:border-primary">
            {d.image ? (
              <img src={d.image.src} alt={d.image.alt} width={56} height={56} loading="lazy" decoding="async" className="size-14 shrink-0 rounded object-cover" />
            ) : (
              <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded bg-primary font-mono text-xs font-bold text-primary-foreground">1689</span>
            )}
            <div className="min-w-0">
              <a href={d.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-bold hover:text-primary">
                {d.title} <ExternalLink className="size-4 shrink-0" />
              </a>
              <p className="mt-1 text-xs text-muted-foreground">{d.note}</p>
              {d.image && (
                <a href={d.image.creditHref} target="_blank" rel="noopener noreferrer" className="mt-1 block text-[10px] text-muted-foreground underline">Image: {d.image.credit}</a>
              )}
              {(() => { const h = FOUNDING_HISTORIES.find((x) => x.id === d.historyId) as FoundingHistory | undefined; return h ? (
                <details className="group mt-2">
                  <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-primary">Read the history <ChevronDown className="size-3.5 transition group-open:rotate-180" /></summary>
                  <HistoryTimeline history={h} compact />
                </details>
              ) : null; })()}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-start gap-3 rounded-lg border border-border p-3 hover:border-primary">
        <img src={nrrImg.url} alt="Front cover of the National Risk Register 2026" width={56} height={56} loading="lazy" decoding="async" className="size-14 shrink-0 rounded object-cover object-top" />
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Official government publication · not a UKStats statistic</p>
          <a href="https://www.gov.uk/government/publications/national-risk-register-2026" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-bold hover:text-primary">
            National Risk Register 2026 <ExternalLink className="size-4 shrink-0" />
          </a>
          <p className="mt-1 text-xs text-muted-foreground">Cabinet Office · published 14 July 2026, updated 12 August 2026. The government's assessment of the most serious risks facing the UK.</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-primary">
            <a href="https://assets.publishing.service.gov.uk/media/6a50d66b1228eb26a4cab76c/National_Risk_Register_2026.pdf" target="_blank" rel="noopener noreferrer" className="underline">Full report (PDF, 223 pages)</a>
            <a href="https://assets.publishing.service.gov.uk/media/6a7c4412aadaaddf89b6e484/A_Guide_to_the_2026_National_Risk_Register.pdf" target="_blank" rel="noopener noreferrer" className="underline">Short guide (PDF, 27 pages)</a>
          </div>
          <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" target="_blank" rel="noopener noreferrer" className="mt-1 block text-[10px] text-muted-foreground underline">Cover: Cabinet Office, Crown copyright, Open Government Licence v3.0</a>
        </div>
      </div>
      <Link to="/founding-documents" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary">Read the full explainer, earliest to latest →</Link>
    </section>
  );
}
