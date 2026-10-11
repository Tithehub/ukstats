import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, Download, ExternalLink, Mail, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const URL = "https://ukstats.co.uk/press";
const TITLE = "Press kit — UKStats, the UK National Data Register";
const DESC =
  "Mission, editorial standards, data sources, citation formats and media kit for journalists citing UKStats, an independent register of official UK statistics.";
const PRESS_EMAIL = "admin@xpre.ai";

export const Route = createFileRoute("/press")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: PressPage,
});

const SOURCES: { body: string; covers: string; url: string }[] = [
  { body: "Office for National Statistics (ONS)", covers: "Inflation, debt, population, migration, labour market, public finances, crime (PFA tables)", url: "https://www.ons.gov.uk" },
  { body: "Home Office", covers: "Irregular arrivals, small boats, asylum costs, visas, police workforce", url: "https://www.gov.uk/government/organisations/home-office" },
  { body: "HM Land Registry", covers: "UK House Price Index", url: "https://landregistry.data.gov.uk" },
  { body: "Bank of England", covers: "Bank Rate", url: "https://www.bankofengland.co.uk" },
  { body: "MI5 / JTAC", covers: "National terrorism threat level", url: "https://www.mi5.gov.uk/threat-levels" },
  { body: "Met Office", covers: "Weather warnings and observations", url: "https://www.metoffice.gov.uk" },
  { body: "Environment Agency", covers: "Flood warnings", url: "https://environment.data.gov.uk/flood-monitoring" },
  { body: "UKHSA", covers: "Weather-health alerts", url: "https://ukhsa-dashboard.data.gov.uk" },
  { body: "Defra", covers: "Daily Air Quality Index", url: "https://uk-air.defra.gov.uk" },
  { body: "Police.uk", covers: "Street-level crime", url: "https://data.police.uk" },
  { body: "Ministry of Defence", covers: "Defence spending and personnel", url: "https://www.gov.uk/government/organisations/ministry-of-defence" },
  { body: "Public Health Scotland", covers: "Scottish NHS performance", url: "https://www.opendata.nhs.scot" },
  { body: "OECD / FCDO", covers: "Official development assistance", url: "https://data.oecd.org" },
  { body: "Electoral Commission", covers: "Registered political parties", url: "https://www.electoralcommission.org.uk" },
];

const KEY_FACTS: { label: string; value: string }[] = [
  { label: "What it is", value: "An independent, free register of official UK statistics" },
  { label: "Sources", value: `${SOURCES.length} official publishers, linked from every figure` },
  { label: "Figures", value: "79 tracked official series with full history where published" },
  { label: "Updates", value: "Checked daily; every figure shows its age and next release date" },
  { label: "Funding", value: "Voluntary donations only — no advertising, no paywalls, no data sales" },
  { label: "Independence", value: "Not affiliated with, funded by, or endorsed by any government body" },
];

const BOILERPLATE =
  "UKStats (ukstats.co.uk) is an independent, free register of official UK statistics. It brings figures from the ONS, Home Office, Bank of England, HM Land Registry, MI5, the Met Office and other public bodies into one place, showing every figure with its source, reference period, age and next scheduled release. UKStats never estimates or invents figures: where no official machine-readable feed exists, it says so and links to the publisher. It is funded by voluntary donations and is not affiliated with any government body.";

function CopyBlock({ label, text }: { label: string; text: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="rounded-xl border border-night-line/60 bg-night-panel/40 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">{label}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(text);
            setDone(true);
            setTimeout(() => setDone(false), 1500);
          }}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-night-line/60 px-3 text-[12px] hover:border-electric"
        >
          {done ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {done ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="whitespace-pre-wrap font-mono text-[13px] leading-relaxed text-night-fg/90">{text}</p>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function PressPage() {
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-electric">Press &amp; media</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Press kit</h1>
        <p className="mt-4 text-night-muted">
          Everything journalists, researchers and broadcasters need to cite UKStats accurately — who we are, how we
          work, and exactly how to credit the figures.
        </p>
        <nav className="mt-6 flex flex-wrap gap-2 text-[12px]">
          {[
            ["Key facts", "#key-facts"],
            ["Mission", "#mission"],
            ["Editorial standards", "#standards"],
            ["How to cite", "#cite"],
            ["Usage rights", "#rights"],
            ["Sources", "#sources"],
            ["Media kit", "#media-kit"],
            ["Contact", "#contact"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-full border border-night-line/60 px-3 py-1.5 text-night-muted hover:border-electric hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>

        <Section id="key-facts" title="Key facts">
          <dl className="grid gap-3 sm:grid-cols-2">
            {KEY_FACTS.map((f) => (
              <div key={f.label} className="rounded-xl border border-night-line/60 bg-night-panel/40 p-4">
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">{f.label}</dt>
                <dd className="mt-2 text-[14px] leading-relaxed text-night-fg/90">{f.value}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="mission" title="Our mission">
          <p className="leading-relaxed text-night-fg/90">
            To put the UK's official numbers in one honest place — sourced, dated and free — so anyone can check
            the facts in seconds instead of hunting across dozens of government websites.
          </p>
          <ul className="mt-4 grid gap-2 text-[14px] text-night-fg/90 sm:grid-cols-2">
            <li>• Official sources, never estimated or invented — the few non-official feeds (such as weather model data) are labelled as such</li>
            <li>• Every figure shows its source, period, age and next release</li>
            <li>• "No live feed" shown plainly where a publisher offers no data</li>
            <li>• Free to use, embed and share; funded by voluntary donations</li>
          </ul>
        </Section>

        <Section id="standards" title="Editorial standards">
          <div className="grid gap-3">
            <div className="rounded-xl border border-night-line/60 bg-night-panel/40 p-4">
              <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-electric" /> Sourcing</p>
              <p className="mt-2 text-[14px] leading-relaxed text-night-fg/90">
                Every figure on UKStats is republished verbatim from an official public body. We do not estimate,
                interpolate, model or adjust any number. Where a publisher offers no machine-readable feed, the card
                says "No live feed" and links to the publisher rather than showing a figure.
              </p>
            </div>
            <div className="rounded-xl border border-night-line/60 bg-night-panel/40 p-4">
              <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-electric" /> Provenance</p>
              <p className="mt-2 text-[14px] leading-relaxed text-night-fg/90">
                Each figure carries its publisher, reference period, publication date, data age and next scheduled
                release, with a direct link to the original publication. Journalists can — and should — verify any
                figure at its source in one click.
              </p>
            </div>
            <div className="rounded-xl border border-night-line/60 bg-night-panel/40 p-4">
              <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-electric" /> Corrections</p>
              <p className="mt-2 text-[14px] leading-relaxed text-night-fg/90">
                If a publisher revises a figure, UKStats reflects the revision on the next daily check and records
                the change in its public change log. To report an error, email{" "}
                <a href={`mailto:${PRESS_EMAIL}?subject=Correction%20%E2%80%94%20UKStats`} className="text-electric hover:underline">
                  {PRESS_EMAIL}
                </a>{" "}
                — corrections from verifiable official sources are applied promptly.
              </p>
            </div>
            <div className="rounded-xl border border-night-line/60 bg-night-panel/40 p-4">
              <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-electric" /> Independence</p>
              <p className="mt-2 text-[14px] leading-relaxed text-night-fg/90">
                UKStats is independent of government, political parties and campaign groups. It carries no
                advertising and sells no data. Running costs are covered by voluntary donations.
              </p>
            </div>
          </div>
        </Section>

        <Section id="cite" title="How to cite us">
          <p className="mb-4 text-[14px] text-night-muted">
            Please cite the original publisher for each figure — every card links to it. Credit UKStats as the place
            you found it.
          </p>
          <div className="grid gap-3">
            <CopyBlock label="Short credit" text="Source: ONS, via UKStats (ukstats.co.uk)" />
            <CopyBlock
              label="Full citation"
              text={`UKStats (${new Date().getFullYear()}). UK National Data Register. Retrieved ${today}, from https://ukstats.co.uk`}
            />
            <CopyBlock label="Broadcast credit" text="Figures: official UK statistics compiled by UKStats" />
          </div>
        </Section>

        <Section id="rights" title="Usage rights">
          <p className="leading-relaxed text-night-fg/90">
            The underlying figures are published by their respective bodies, most under the{" "}
            <a
              href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-electric hover:underline"
            >
              Open Government Licence <ExternalLink className="h-3.5 w-3.5" />
            </a>
            , which permits reuse with attribution. UKStats' own presentation — charts, embeds and the daily written
            record — is free for editorial use with a credit and link to ukstats.co.uk. No permission is needed for
            news reporting, commentary or academic use.
          </p>
        </Section>

        <Section id="sources" title="Data sources">
          <div className="overflow-x-auto rounded-xl border border-night-line/60">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-night-panel/60 font-mono text-[11px] uppercase tracking-wider text-night-muted">
                <tr><th className="p-3">Publisher</th><th className="p-3">What we use</th></tr>
              </thead>
              <tbody>
                {SOURCES.map((s) => (
                  <tr key={s.body} className="border-t border-night-line/40">
                    <td className="p-3">
                      <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-electric hover:underline">
                        {s.body} <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </td>
                    <td className="p-3 text-night-fg/80">{s.covers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="media-kit" title="Media kit">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-night-line/60 bg-night-panel/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">Logo</p>
              <div className="mt-3 rounded-lg bg-white p-4">
                <img src="/press/ukstats-logo.png" alt="UKStats logo" width={1600} height={608} loading="lazy" className="h-auto w-full" />
              </div>
              <a
                href="/press/ukstats-logo.png"
                download="ukstats-logo.png"
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-night-line/60 px-4 text-[13px] font-semibold hover:border-electric"
              >
                <Download className="h-4 w-4" /> Download logo (PNG)
              </a>
              <p className="mt-2 text-[13px] text-night-muted">Write the name as "UKStats" — one word, capital U, K and S.</p>
            </div>
            <div className="rounded-xl border border-night-line/60 bg-night-panel/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">Colours &amp; type</p>
              <div className="mt-3 flex gap-2">
                <span className="h-10 w-10 rounded-md border border-night-line bg-background" title="Navy ground" />
                <span className="h-10 w-10 rounded-md bg-electric" title="Electric blue" />
                <span className="h-10 w-10 rounded-md bg-night-panel" title="Panel" />
              </div>
              <p className="mt-2 text-[13px] text-night-muted">Navy ground, electric blue accent. Archivo and IBM Plex Mono.</p>
            </div>
            <div className="rounded-xl border border-night-line/60 bg-night-panel/40 p-4 sm:col-span-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">Embeds, feeds &amp; data</p>
              <p className="mt-2 text-[14px] leading-relaxed text-night-fg/90">
                Live embeddable cards at <a className="text-electric hover:underline" href="/widget">/widget</a>, a daily written
                record at <a className="text-electric hover:underline" href="/daily">/daily</a>, an RSS feed at{" "}
                <a className="text-electric hover:underline" href="/feed.xml">/feed.xml</a> and a free open data API documented at{" "}
                <a className="text-electric hover:underline" href="/api-docs">/api-docs</a>. All free for editorial use.
              </p>
            </div>
          </div>
        </Section>

        <Section id="about" title="About UKStats — boilerplate">
          <CopyBlock label="Boilerplate" text={BOILERPLATE} />
        </Section>

        <Section id="contact" title="Press contact">
          <p className="mb-4 text-[14px] text-night-muted">
            For comment, interviews, data checks, corrections or embargo questions, email the press team — media
            enquiries are answered first.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${PRESS_EMAIL}?subject=Media%20enquiry%20%E2%80%94%20UKStats`}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-electric px-4 text-[14px] font-semibold text-background hover:opacity-90"
            >
              <Mail className="h-4 w-4" /> Email the press team
            </a>
          </div>
          <div className="mt-3">
            <CopyBlock label="Press contact" text={PRESS_EMAIL} />
          </div>
          <p className="mt-4 text-[14px] text-night-muted">
            Published something using our figures?{" "}
            <a href="/coverage" className="text-electric hover:underline">
              Submit it to our media coverage page
            </a>{" "}
            and we'll link to it with a thumbnail.
          </p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
