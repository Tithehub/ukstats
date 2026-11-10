import { ExternalLink } from "lucide-react";

const DOCS = [
  { title: "Bill of Rights 1689", note: "Rights of Parliament and the subject", href: "https://www.legislation.gov.uk/aep/WillandMarSess2/1/2/contents" },
  { title: "Magna Carta (1297)", note: "Clauses still in force in England", href: "https://www.legislation.gov.uk/aep/Edw1cc1929/25/9/contents" },
  { title: "Claim of Right 1689", note: "Scotland's equivalent", href: "https://www.legislation.gov.uk/aosp/1689/28/contents" },
  { title: "Act of Settlement 1701", note: "Succession and judicial independence", href: "https://www.legislation.gov.uk/aep/Will3/12-13/2/contents" },
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
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {DOCS.map((d) => (
          <li key={d.href}>
            <a href={d.href} target="_blank" rel="noopener noreferrer" className="flex h-full flex-col justify-between rounded-lg border border-border p-3 hover:border-primary">
              <span className="flex items-center gap-1.5 font-bold">{d.title} <ExternalLink className="size-4 shrink-0" /></span>
              <span className="mt-1 text-xs text-muted-foreground">{d.note}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
