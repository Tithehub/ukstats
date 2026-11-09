import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { RacingLayout } from "@/components/racing/RacingLayout";
import { racingAdmin } from "@/lib/racing/racing.functions";
import { useAuth } from "@/lib/useAuth";
import { fmtDate } from "@/lib/uk-stats";

export const Route = createFileRoute("/racing/admin")({
  head: () => ({ meta: [{ title: "Racing data administration | UKStats" }, { name: "description", content: "Racing data provider health, imports and audit log for UKStats administrators." }, { property: "og:title", content: "Racing admin — UKStats" }, { property: "og:description", content: "Administrators only." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  ssr: false,
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const fn = useServerFn(racingAdmin);
  const q = useQuery({ queryKey: ["racing", "admin", user?.id], queryFn: () => fn(), enabled: !!user });
  if (!user) return <RacingLayout title="Racing admin"><p>Please <Link to="/auth" className="underline">sign in</Link> as an administrator.</p></RacingLayout>;
  if (q.isPending) return <RacingLayout title="Racing admin"><p className="text-night-muted">Loading…</p></RacingLayout>;
  if (q.isError || !q.data?.allowed) return <RacingLayout title="Racing admin"><p>Administrators only.</p></RacingLayout>;
  const d = q.data;
  return <RacingLayout title="Racing admin" intro="Provider health, import jobs and the audit trail. Every correction is logged with who made it, when, why and the original value.">
    <section><h2 className="text-lg font-semibold">Data providers</h2>
      {!d.sources.length ? <p className="mt-2 text-sm text-night-muted">No provider set up yet. Add a licensed provider's key as a secret, then add its adapter.</p> :
        <ul className="mt-2 space-y-2">{d.sources.map((s) => <li key={s.id} className="rounded border border-night-line bg-night-panel p-3 text-sm">
          <strong>{s.name}</strong> · {s.kind} · <span className={s.status === "connected" ? "text-racing-gold" : "text-destructive"}>{s.status}</span>
          <div className="text-xs text-night-muted">Last success: {s.last_success_at ? fmtDate(s.last_success_at) : "never"} · Records: {s.records_imported}{s.last_error ? ` · Last error: ${s.last_error}` : ""}</div></li>)}</ul>}
    </section>
    <section className="mt-6"><h2 className="text-lg font-semibold">Import jobs</h2>
      {!d.logs.length ? <p className="mt-2 text-sm text-night-muted">No imports have run.</p> : <ul className="mt-2 text-sm">{d.logs.map((l) => <li key={l.id} className="border-b border-night-line py-1">{fmtDate(l.started_at)} · {l.job} · {l.status} · {l.records} records{l.error ? ` · ${l.error}` : ""}</li>)}</ul>}
    </section>
    <section className="mt-6"><h2 className="text-lg font-semibold">Audit log</h2>
      {!d.audit.length ? <p className="mt-2 text-sm text-night-muted">No changes recorded.</p> : <ul className="mt-2 text-sm">{d.audit.map((a) => <li key={a.id} className="border-b border-night-line py-1">{fmtDate(a.created_at)} · {a.entity} {a.entity_id} · {a.action}{a.reason ? ` · ${a.reason}` : ""}</li>)}</ul>}
    </section>
  </RacingLayout>;
}
