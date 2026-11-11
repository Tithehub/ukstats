import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import TERMS from "@/lib/terms.data";

const URL = "https://ukstats.co.uk/terms";
const TITLE = "Terms & Conditions — UKStats";
const DESC = "The terms for using UKStats: information only, official sources as published, liability limits, paid reports, sponsors and acceptable use.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-[820px] px-4 py-10 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-night-muted">Legal</p>
        <h1 className="mt-2 text-3xl font-bold">Terms &amp; Conditions</h1>
        <p className="mt-2 font-mono text-[12px] text-night-muted">Version {TERMS.version} · Effective {TERMS.effective}</p>
        <a href="/legal/ukstats-terms.pdf" target="_blank" rel="noopener" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md bg-electric px-4 text-sm font-semibold text-night hover:opacity-90">
          <Download className="size-4" aria-hidden="true" /> Download PDF
        </a>
        <ol className="mt-8 space-y-7">
          {TERMS.sections.map((s, i) => (
            <li key={s.title}>
              <h2 className="text-lg font-semibold">{i + 1}. {s.title}</h2>
              {s.body.map((p) => <p key={p} className="mt-2 text-[15px] leading-relaxed text-night-muted">{p}</p>)}
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter />
    </div>
  );
}
