import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

const URL = "https://ukstats.co.uk/press";
const TITLE = "Press kit — UKStats, the UK National Data Register";
const DESC =
  "Mission, data sources, citation formats and media kit for journalists citing UKStats, an independent register of official UK statistics.";

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

const BOILERPLATE =
  "UKStats (ukstats.co.uk) is an independent, free register of official UK statistics. It brings figures from the ONS, Home Office, Bank of England, HM Land Registry, MI5, the Met Office and other public bodies into one place, showing every figure with its source, reference period, age and next scheduled release. UKStats never estimates or invents figures: where no official machine-readable feed exists, it says so and links to the publisher.";

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
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
          Everything journalists, researchers and broadcasters need to cite UKStats accurately.
        </p>

        <Section title="Our mission">
          <p className="leading-relaxed text-night-fg/90">
            To put the UK's official numbers in one honest place — sourced, dated and free — so anyone can check
            the facts in seconds instead of hunting across dozens of government websites.
          </p>
          <ul className="mt-4 grid gap-2 text-[14px] text-night-fg/90 sm:grid-cols-2">
            <li>• Official sources only — no estimates, models or invented figures</li>
            <li>• Every figure shows its source, period, age and next release</li>
            <li>• "No live feed" shown plainly where a publisher offers no data</li>
            <li>• Free to use, embed and share; funded by voluntary donations</li>
          </ul>
        </Section>

        <Section title="How to cite us">
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

        <Section title="About UKStats — boilerplate">
          <CopyBlock label="Boilerplate" text={BOILERPLATE} />
        </Section>

        <Section title="Data sources">
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

        <Section title="Media kit">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-night-line/60 bg-night-panel/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">Name</p>
              <p className="mt-2 text-2xl font-bold">UK<span className="text-electric">Stats</span></p>
              <p className="mt-2 text-[13px] text-night-muted">Write as "UKStats" — one word, capital U, K and S.</p>
            </div>
            <div className="rounded-xl border border-night-line/60 bg-night-panel/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">Colours &amp; type</p>
              <div className="mt-3 flex gap-2">
                <span className="h-10 w-10 rounded-md border border-night-line bg-background" />
                <span className="h-10 w-10 rounded-md bg-electric" />
                <span className="h-10 w-10 rounded-md bg-night-panel" />
              </div>
              <p className="mt-2 text-[13px] text-night-muted">Navy ground, electric blue accent. Archivo and IBM Plex Mono.</p>
            </div>
            <div className="rounded-xl border border-night-line/60 bg-night-panel/40 p-4 sm:col-span-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">Embeds &amp; feeds</p>
              <p className="mt-2 text-[14px] text-night-fg/90">
                Live embeddable cards at <a className="text-electric hover:underline" href="/widget">/widget</a>, a daily written
                record at <a className="text-electric hover:underline" href="/daily">/daily</a> and an RSS feed at{" "}
                <a className="text-electric hover:underline" href="/feed.xml">/feed.xml</a>. Free for editorial use.
              </p>
            </div>
          </div>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
