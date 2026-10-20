import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ShareRow } from "@/components/ShareRow";
import { RestoreSignupCta } from "@/components/RestoreSignupCta";
import { getPolling, getPartyRegister } from "@/lib/uk-stats.functions";
import { fmtDate } from "@/lib/uk-stats";

export const Route = createFileRoute("/polling")({
  head: () => ({
    meta: [
      { title: "UK voting intention and registered parties" },
      {
        name: "description",
        content:
          "Westminster voting intention from each pollster's own published release, plus the full Electoral Commission register of political parties in Great Britain and Northern Ireland.",
      },
      { property: "og:title", content: "UK voting intention and registered parties" },
      {
        property: "og:description",
        content: "Pollsters' own published voting intention figures and the live Electoral Commission party register.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/polling" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/polling" }],
  }),
  loader: async () => {
    const [polling, register] = await Promise.all([getPolling(), getPartyRegister()]);
    return { polling, register };
  },
  component: PollingPage,
});

/** Certified national result, General Election 4 July 2024 (House of Commons Library, CBP-10009). */
const GE2024: { party: string; share: number }[] = [
  { party: "Labour", share: 33.7 },
  { party: "Conservative", share: 23.7 },
  { party: "Reform UK", share: 14.3 },
  { party: "Liberal Democrats", share: 12.2 },
  { party: "Green Party", share: 6.4 },
  { party: "SNP", share: 2.5 },
  { party: "Plaid Cymru", share: 0.7 },
];

const PARTY_TONE: Record<string, string> = {
  Labour: "#e4003b",
  Conservative: "#0087dc",
  "Reform UK": "#12b6cf",
  "Liberal Democrats": "#faa61a",
  "Green Party": "#02a95b",
  SNP: "#fdf38e",
  "Plaid Cymru": "#005b54",
};

function PollingPage() {
  const { polling, register } = Route.useLoaderData();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [reg, setReg] = useState<"all" | "Great Britain" | "Northern Ireland">("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return register.parties.filter(
      (p) =>
        (reg === "all" || p.register === reg) &&
        (!needle || p.name.toLowerCase().includes(needle) || (p.town ?? "").toLowerCase().includes(needle)),
    );
  }, [register.parties, q, reg]);

  const max = Math.max(...polling.average.map((a) => a.share), ...GE2024.map((g) => g.share));

  return (
    <div className="min-h-dvh bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-night-muted">Politics &amp; polling</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Voting intention and the party register
        </h1>
        <p className="mt-3 max-w-2xl text-night-muted">
          Each figure below is read from a pollster&rsquo;s own published release or from the Electoral
          Commission&rsquo;s live register. Nothing is modelled, weighted or smoothed here: the average is a plain
          unweighted mean of the most recent release from each pollster within {polling.windowDays} days.
        </p>

        <RestoreSignupCta />

        <h2 className="mt-10 text-lg font-semibold">National voting intention</h2>
        <p className="mt-3 text-sm"><Link to="/parties" search={{ view: "election" }} className="text-electric-soft underline">Compare party election rankings and manifesto positions →</Link></p>
        {polling.average.length ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {polling.average.map((a) => (
              <div key={a.party} className="rounded-lg border border-night-line/70 bg-night-panel p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-night-muted">{a.party}</p>
                  <span className="font-mono text-[11px] text-night-muted">{a.polls} polls</span>
                </div>
                <p className="mt-1 text-3xl font-semibold tabular-nums">{a.share.toFixed(1)}%</p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-night-line/50">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${(a.share / max) * 100}%`,
                      background: PARTY_TONE[a.party] ?? "var(--color-electric)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-night-line/70 bg-night-panel p-6 font-mono text-[13px] text-overdue">
            No live feed. No pollster release could be read machine-readably for this request, so no average is shown.
            Every pollster&rsquo;s own release is linked below — those pages carry the published figures.
          </p>
        )}

        {polling.polls.length ? (
          <>
            <h2 className="mt-10 text-lg font-semibold">Releases in the average</h2>
            <div className="mt-3 overflow-x-auto rounded-lg border border-night-line/70 bg-night-panel">
              <table className="w-full min-w-[640px] border-collapse font-mono text-[12px]">
                <thead>
                  <tr className="border-b border-night-line/70 text-night-muted">
                    <th className="px-3 py-2 text-left font-normal">Pollster</th>
                    <th className="px-3 py-2 text-left font-normal">Fieldwork end</th>
                    <th className="px-3 py-2 text-right font-normal">Sample</th>
                    <th className="px-3 py-2 text-left font-normal">Published shares</th>
                  </tr>
                </thead>
                <tbody>
                  {polling.polls.map((p) => (
                    <tr key={p.pollster} className="border-b border-night-line/40 last:border-0">
                      <td className="px-3 py-2">
                        <a href={p.url} target="_blank" rel="noreferrer" className="text-electric-soft underline">
                          {p.pollster}
                        </a>
                      </td>
                      <td className="px-3 py-2">{p.fieldworkEnd ?? "not stated"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {p.sampleSize ? p.sampleSize.toLocaleString("en-GB") : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {Object.entries(p.shares)
                          .map(([party, v]) => `${party} ${v}%`)
                          .join(" · ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {polling.unavailable.length ? (
          <>
            <h2 className="mt-10 text-lg font-semibold">Pollsters not in the average</h2>
            <ul className="mt-3 grid gap-2 font-mono text-[12px] text-night-muted">
              {polling.unavailable.map((u) => (
                <li key={u.pollster}>
                  <a href={u.url} target="_blank" rel="noreferrer" className="text-electric-soft underline">
                    {u.pollster}
                  </a>{" "}
                  — {u.reason}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        <h2 className="mt-10 text-lg font-semibold">Last certified result</h2>
        <p className="mt-2 text-sm text-night-muted">
          General Election, 4 July 2024, UK-wide vote share as certified and published by the House of Commons Library.
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg border border-night-line/70 bg-night-panel">
          <table className="w-full min-w-[360px] border-collapse font-mono text-[12px]">
            <tbody>
              {GE2024.map((g) => (
                <tr key={g.party} className="border-b border-night-line/40 last:border-0">
                  <td className="px-3 py-2">{g.party}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{g.share.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 font-mono text-[11px] text-night-muted">
          <a
            href="https://commonslibrary.parliament.uk/research-briefings/cbp-10009/"
            target="_blank"
            rel="noreferrer"
            className="text-electric-soft underline"
          >
            House of Commons Library, General Election 2024: results and analysis
          </a>
        </p>

        <h2 className="mt-10 text-lg font-semibold">Registered political parties</h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-3 flex w-full items-center justify-between rounded-lg border border-night-line/70 bg-night-panel px-4 py-3 text-left font-mono text-[12px] transition-colors hover:border-electric"
        >
          <span>
            Electoral Commission register · {register.parties.length.toLocaleString("en-GB")} parties currently
            registered
          </span>
          <span aria-hidden>{open ? "−" : "+"}</span>
        </button>

        {open ? (
          register.error ? (
            <p className="mt-3 rounded-lg border border-night-line/70 bg-night-panel p-4 font-mono text-[12px] text-overdue">
              {register.error} The register is published at{" "}
              <a
                href="https://search.electoralcommission.org.uk/"
                target="_blank"
                rel="noreferrer"
                className="text-electric-soft underline"
              >
                search.electoralcommission.org.uk
              </a>
              .
            </p>
          ) : (
            <div className="mt-3 rounded-lg border border-night-line/70 bg-night-panel p-4">
              <div className="flex flex-wrap gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search party or town"
                  aria-label="Search registered parties"
                  className="min-w-[220px] flex-1 rounded-md border border-night-line/70 bg-night px-3 py-2 font-mono text-[12px] outline-none focus:border-electric"
                />
                <div className="inline-flex rounded-md border border-night-line/70 p-1 font-mono text-[12px]">
                  {(["all", "Great Britain", "Northern Ireland"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReg(r)}
                      className={`rounded px-3 py-1.5 transition-colors ${
                        reg === r ? "bg-electric/15 text-electric-soft" : "text-night-muted hover:text-night-fg"
                      }`}
                    >
                      {r === "all" ? "All registers" : r}
                    </button>
                  ))}
                </div>
              </div>
              <p className="mt-3 font-mono text-[11px] text-night-muted">
                {filtered.length.toLocaleString("en-GB")} shown · read {fmtDate(register.fetchedAt)}
              </p>
              <div className="mt-3 max-h-[560px] overflow-auto">
                <table className="w-full min-w-[540px] border-collapse font-mono text-[12px]">
                  <thead className="sticky top-0 bg-night-panel">
                    <tr className="border-b border-night-line/70 text-night-muted">
                      <th className="px-3 py-2 text-left font-normal">Party</th>
                      <th className="px-3 py-2 text-left font-normal">Status</th>
                      <th className="px-3 py-2 text-left font-normal">Register</th>
                      <th className="px-3 py-2 text-left font-normal">Base</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-b border-night-line/40 last:border-0">
                        <td className="px-3 py-2">
                          <a href={p.url} target="_blank" rel="noreferrer" className="text-electric-soft underline">
                            {p.name}
                          </a>
                        </td>
                        <td className="px-3 py-2">{p.status}</td>
                        <td className="px-3 py-2">{p.register}</td>
                        <td className="px-3 py-2">{p.town ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : null}

        <h2 className="mt-10 text-lg font-semibold">Official sources</h2>
        <ul className="mt-3 grid gap-2 font-mono text-[12px] text-night-muted">
          <li>
            <a
              href="https://search.electoralcommission.org.uk/?currentPage=1&amp;et=pp&amp;register=gb&amp;regStatus=registered"
              target="_blank"
              rel="noreferrer"
              className="text-electric-soft underline"
            >
              The Electoral Commission — register of political parties
            </a>
          </li>
          <li>
            <a
              href="https://commonslibrary.parliament.uk/research-briefings/cbp-10009/"
              target="_blank"
              rel="noreferrer"
              className="text-electric-soft underline"
            >
              House of Commons Library — General Election 2024 results
            </a>
          </li>
          {[...polling.polls, ...polling.unavailable].map((p) => (
            <li key={p.url}>
              <a href={p.url} target="_blank" rel="noreferrer" className="text-electric-soft underline">
                {"pollster" in p ? p.pollster : ""} — published release
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <ShareRow title="UK voting intention and registered parties" path="/polling" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
