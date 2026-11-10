import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HistoryTimeline } from "@/components/home/FoundingTimeline";
import { FOUNDING_HISTORIES, HISTORY_CHECKED } from "@/lib/founding-documents.data";

const TITLE = "UK founding documents explained — Magna Carta to the Act of Settlement | UKStats";
const DESC = "Plain-English history of Magna Carta, the Bill of Rights 1689, the Claim of Right 1689 and the Act of Settlement 1701, earliest to latest, with official sources.";
const URL = "https://ukstats.co.uk/founding-documents";

export const Route = createFileRoute("/founding-documents")({
  head: () => ({
    meta: [
      { title: TITLE }, { name: "description", content: DESC },
      { property: "og:title", content: TITLE }, { property: "og:description", content: DESC },
      { property: "og:type", content: "article" }, { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: Page,
});

const LAW: Record<string, string> = {
  "magna-carta": "https://www.legislation.gov.uk/aep/Edw1cc1929/25/9/contents",
  "bill-of-rights": "https://www.legislation.gov.uk/aep/WillandMarSess2/1/2/contents",
  "claim-of-right": "https://www.legislation.gov.uk/aosp/1689/28/contents",
  "act-of-settlement": "https://www.legislation.gov.uk/aep/Will3/12-13/2/contents",
};

function Page() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[860px] px-4 py-10 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Official legal text · not statistics</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Our founding documents, explained</h1>
        <p className="mt-2 text-muted-foreground">The UK has no single written constitution. These four documents sit at its core. Below is each one's story from earliest to latest, with a link to the official source for every step. Sources checked {HISTORY_CHECKED}.</p>
        <p className="mt-2 text-sm text-muted-foreground">We only describe a change as unlawful where a court or official body has said so, and we quote it.</p>
        <nav aria-label="Jump to document" className="mt-4 flex flex-wrap gap-2 text-sm">
          {FOUNDING_HISTORIES.map((h) => <a key={h.id} href={`#${h.id}`} className="rounded border border-border px-3 py-2 hover:border-primary">{h.title}</a>)}
        </nav>
        {FOUNDING_HISTORIES.map((h) => (
          <section key={h.id} id={h.id} className="mt-8 scroll-mt-24 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-2xl font-black">{h.title}</h2>
            <a href={LAW[h.id]} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary">Read the official text on legislation.gov.uk <ExternalLink className="size-4" /></a>
            <HistoryTimeline history={h} />
          </section>
        ))}
      </main>
      <SiteFooter />
    </>
  );
}
