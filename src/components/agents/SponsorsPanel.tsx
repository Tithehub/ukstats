import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSponsorsAdmin, setSponsorApproval } from "@/lib/sponsor.functions";

export function SponsorsPanel() {
  const list = useServerFn(listSponsorsAdmin);
  const approve = useServerFn(setSponsorApproval);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["sponsors-admin"], queryFn: () => list() });
  const sponsors = q.data?.sponsors ?? [];
  const enquiries = q.data?.enquiries ?? [];
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">Sponsors ({sponsors.length})</h2>
      <p className="mt-1 text-sm text-night-muted">Paid lines only show after you approve them. Check the name and link follow the rules.</p>
      <ul className="mt-3 divide-y divide-night-line rounded-xl border border-night-line">
        {sponsors.length === 0 ? <li className="px-4 py-3 text-sm text-night-muted">No sponsors yet.</li> : null}
        {sponsors.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{s.name}{s.tagline ? ` — ${s.tagline}` : ""}</p>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="break-all text-electric-soft">{s.url}</a>
              <p className="font-mono text-[11px] text-night-muted">{s.plan ?? "manual"} · {s.environment === "sandbox" ? "test" : s.environment ?? "manual"} · {s.paid ? "paid" : "not paid"} · {s.approved ? "approved" : "awaiting approval"}</p>
            </div>
            <button
              type="button"
              disabled={s.name === "Pending details"}
              onClick={async () => { await approve({ data: { id: s.id, approved: !s.approved } }); qc.invalidateQueries({ queryKey: ["sponsors-admin"] }); }}
              className="rounded-md border border-night-line px-3 py-1.5 disabled:opacity-50"
            >
              {s.approved ? "Turn off" : "Approve"}
            </button>
          </li>
        ))}
      </ul>
      <h3 className="mt-6 font-semibold">Sponsor enquiries ({enquiries.length})</h3>
      <ul className="mt-2 divide-y divide-night-line rounded-xl border border-night-line text-sm">
        {enquiries.length === 0 ? <li className="px-4 py-3 text-night-muted">None yet.</li> : null}
        {enquiries.map((e) => (
          <li key={e.id} className="px-4 py-3">
            <p className="font-medium">{e.company} · {e.name} · <a className="text-electric-soft" href={`mailto:${e.email}`}>{e.email}</a></p>
            {e.message ? <p className="mt-1 text-night-muted">{e.message}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
