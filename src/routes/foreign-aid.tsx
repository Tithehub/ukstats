import { createFileRoute } from "@tanstack/react-router";
import { RestoreSignupCta } from "@/components/RestoreSignupCta";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ShareRow } from "@/components/ShareRow";
import { getForeignAid, AID_SOURCES } from "@/lib/uk-stats.functions";
import { fmtDate } from "@/lib/uk-stats";

export const Route = createFileRoute("/foreign-aid")({
  head: () => ({
    meta: [
      { title: "UK foreign aid spend, every published year" },
      {
        name: "description",
        content:
          "Total UK overseas aid (official development assistance) in cash pounds for every year on the public record since 1960, with the share of national income and links to the official releases.",
      },
      { property: "og:title", content: "UK foreign aid spend by year" },
      {
        property: "og:description",
        content: "Published UK official development assistance in cash terms and as a share of national income.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ukstats.co.uk/foreign-aid" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/foreign-aid" }],
  }),
  loader: () => getForeignAid(),
  component: ForeignAidPage,
});

type Mode = "cash" | "gni";

const bn = (m: number) => `£${(m / 1000).toLocaleString("en-GB", { maximumFractionDigits: 2 })}bn`;

function ForeignAidPage() {
  const { points, fetchedAt } = Route.useLoaderData();
  const [mode, setMode] = useState<Mode>("cash");
  const [hover, setHover] = useState<number | null>(null);

  const valueOf = (p: (typeof points)[number]) => (mode === "cash" ? p.gbpM : p.pctGni);
  const fmt = (v: number) => (mode === "cash" ? bn(v) : `${v.toFixed(2)}%`);

  const usable = useMemo(
    () => points.filter((p) => (mode === "cash" ? p.gbpM !== null : p.pctGni !== null)),
    [points, mode],
  );
  const latest = usable[usable.length - 1];
  const active = hover !== null ? usable[hover] : latest;

  const chart = useMemo(() => {
    const w = 900;
    const h = 340;
    const padL = 64;
    const padB = 30;
    const padT = 14;
    const values = usable.map((p) => (mode === "cash" ? p.gbpM! : p.pctGni!));
    if (values.length < 2) return null;
    const max = Math.max(...values);
    const x = (i: number) => padL + (i * (w - padL - 8)) / Math.max(1, usable.length - 1);
    const y = (v: number) => padT + (1 - v / max) * (h - padT - padB);
    let d = "";
    usable.forEach((p, i) => {
      const v = mode === "cash" ? p.gbpM! : p.pctGni!;
      d += `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
    });
    return { w, h, padL, padB, padT, max, x, y, line: d.trim() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usable, mode]);

  function csv() {
    const rows = [
      "Year,UK official development assistance (£m),Share of gross national income (%),Basis",
      ...points.map((p) => `${p.year},${p.gbpM ?? ""},${p.pctGni ?? ""},${p.basis}`),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([rows], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "uk-foreign-aid.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-night text-night-fg">
      <SiteHeader />
      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-night-muted">Fiscal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">UK foreign aid spend, year by year</h1>
        <p className="mt-3 max-w-2xl text-night-muted">
          Total UK official development assistance in cash pounds, and as a share of national income, for every year on
          the public record. These are the UK government&rsquo;s own returns as published — nothing here is deflated,
          spliced or estimated.
        </p>
        <RestoreSignupCta />

        {!chart ? (
          <p className="mt-8 rounded-lg border border-night-line/70 bg-night-panel p-6 font-mono text-[13px] text-overdue">
            No live feed. The published aid series could not be read for this request. The official releases are linked
            below.
          </p>
        ) : (
          <>
            <div className="mt-6 inline-flex rounded-md border border-night-line/70 bg-night-panel p-1 font-mono text-[12px]">
              {(
                [
                  ["cash", "Cash £"],
                  ["gni", "% of national income"],
                ] as [Mode, string][]
              ).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setHover(null);
                  }}
                  className={`rounded px-3 py-1.5 transition-colors ${
                    mode === m ? "bg-electric/15 text-electric-soft" : "text-night-muted hover:text-night-fg"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Stat
                label={mode === "cash" ? "Aid spend" : "Share of national income"}
                value={active ? fmt(valueOf(active)!) : "—"}
                note={active ? `${active.year} · ${active.basis.toLowerCase()} basis` : ""}
              />
              <Stat
                label="Latest published year"
                value={latest?.year ?? "—"}
                note={latest ? `${latest.basis} basis, as published` : ""}
              />
              <Stat
                label="Published years"
                value={String(usable.length)}
                note={usable.length ? `${usable[0]!.year} to ${latest?.year}` : ""}
              />
            </div>

            <figure className="mt-6 rounded-lg border border-night-line/70 bg-night-panel p-4">
              <svg
                viewBox={`0 0 ${chart.w} ${chart.h}`}
                className="w-full"
                role="img"
                aria-label={
                  mode === "cash"
                    ? "UK official development assistance in cash pounds, by year"
                    : "UK official development assistance as a share of gross national income, by year"
                }
                onMouseLeave={() => setHover(null)}
              >
                {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                  const v = chart.max * t;
                  return (
                    <g key={t}>
                      <line
                        x1={chart.padL}
                        x2={chart.w - 8}
                        y1={chart.y(v)}
                        y2={chart.y(v)}
                        stroke="currentColor"
                        strokeOpacity={0.12}
                      />
                      <text x={4} y={chart.y(v) + 4} className="fill-current font-mono text-[11px] opacity-60">
                        {fmt(v)}
                      </text>
                    </g>
                  );
                })}
                {mode === "gni" && chart.max >= 0.7 ? (
                  <g>
                    <line
                      x1={chart.padL}
                      x2={chart.w - 8}
                      y1={chart.y(0.7)}
                      y2={chart.y(0.7)}
                      stroke="var(--color-fresh)"
                      strokeDasharray="5 4"
                    />
                    <text
                      x={chart.w - 10}
                      y={chart.y(0.7) - 6}
                      textAnchor="end"
                      className="fill-current font-mono text-[10px] opacity-70"
                    >
                      0.7% commitment
                    </text>
                  </g>
                ) : null}
                <path d={chart.line} fill="none" stroke="var(--color-electric)" strokeWidth={2} />
                {usable.map((p, i) => (
                  <rect
                    key={p.year}
                    x={chart.x(i) - 4}
                    y={chart.padT}
                    width={8}
                    height={chart.h - chart.padT - chart.padB}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                  />
                ))}
                {hover !== null ? (
                  <line
                    x1={chart.x(hover)}
                    x2={chart.x(hover)}
                    y1={chart.padT}
                    y2={chart.h - chart.padB}
                    stroke="currentColor"
                    strokeOpacity={0.35}
                  />
                ) : null}
                {usable
                  .map((p, i) => ({ p, i }))
                  .filter(({ i }) => i % Math.ceil(usable.length / 10) === 0)
                  .map(({ p, i }) => (
                    <text
                      key={p.year}
                      x={chart.x(i)}
                      y={chart.h - 8}
                      textAnchor="middle"
                      className="fill-current font-mono text-[11px] opacity-60"
                    >
                      {p.year}
                    </text>
                  ))}
              </svg>
              <figcaption className="mt-2 flex flex-wrap gap-4 font-mono text-[11px] text-night-muted">
                <span className="flex items-center gap-2">
                  <span className="inline-block h-0.5 w-5 bg-electric" />{" "}
                  {mode === "cash"
                    ? "UK official development assistance, cash £"
                    : "UK aid as a share of gross national income"}
                </span>
              </figcaption>
            </figure>

            <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[12px] text-night-muted">
              <button
                type="button"
                onClick={csv}
                className="rounded-md border border-night-line/70 px-3 py-2 transition-colors hover:border-electric hover:text-electric-soft"
              >
                Download CSV
              </button>
              <span>
                {usable.length} published years · read {fmtDate(fetchedAt)}
              </span>
            </div>

            <p className="mt-6 max-w-3xl text-sm text-night-muted">
              The measurement basis changed in 2018: from that year the headline is the grant-equivalent measure the
              OECD DAC now uses, and earlier years are published as net disbursements. Both are the publisher&rsquo;s
              own figures for the year concerned and are shown as such in the table — they are not spliced into a single
              adjusted series here. The most recent year is provisional until the final release later in the year.
            </p>

            <h2 className="mt-10 text-lg font-semibold">Year by year</h2>
            <div className="mt-3 overflow-x-auto rounded-lg border border-night-line/70 bg-night-panel">
              <table className="w-full min-w-[520px] border-collapse font-mono text-[12px]">
                <thead>
                  <tr className="border-b border-night-line/70 text-night-muted">
                    <th className="px-3 py-2 text-left font-normal">Year</th>
                    <th className="px-3 py-2 text-right font-normal">Aid spend</th>
                    <th className="px-3 py-2 text-right font-normal">Share of national income</th>
                    <th className="px-3 py-2 text-right font-normal">Published basis</th>
                  </tr>
                </thead>
                <tbody>
                  {[...points].reverse().map((p) => (
                    <tr key={p.year} className="border-b border-night-line/40 last:border-0">
                      <td className="px-3 py-2 text-left tabular-nums">{p.year}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{p.gbpM !== null ? bn(p.gbpM) : "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {p.pctGni !== null ? `${p.pctGni.toFixed(2)}%` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">{p.basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="mt-10 text-lg font-semibold">Official sources</h2>
            <ul className="mt-3 grid gap-2 font-mono text-[12px] text-night-muted">
              {AID_SOURCES.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-electric-soft underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <ShareRow title="UK foreign aid spend, year by year" path="/foreign-aid" />
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border border-night-line/70 bg-night-panel p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-night-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 font-mono text-[11px] text-night-muted">{note}</p>
    </div>
  );
}
