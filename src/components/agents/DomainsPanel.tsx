import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, ExternalLink, Globe, Loader2, RefreshCw, XCircle } from "lucide-react";
import { checkDomains, SITE_DOMAINS, type DomainCheck } from "@/lib/agents.functions";

export function DomainsPanel() {
  const check = useServerFn(checkDomains);
  const [results, setResults] = useState<Record<string, DomainCheck>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const run = async (domain?: (typeof SITE_DOMAINS)[number]) => {
    setBusy(domain ?? "all");
    setErr(null);
    try {
      const checks = await check({ data: { domain } });
      setResults((prev) => {
        const next = { ...prev };
        for (const c of checks) next[c.domain] = c;
        return next;
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Check failed");
    }
    setBusy(null);
  };

  return (
    <section className="mt-8 rounded-xl border border-night-line bg-night-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-night-muted">
          <Globe className="h-4 w-4 text-electric" aria-hidden /> Domains
        </h2>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run()}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-electric px-4 text-[13px] font-medium text-night disabled:opacity-60"
        >
          {busy === "all" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
          Check all
        </button>
      </div>
      {err ? <p className="mt-3 text-overdue">{err}</p> : null}
      <ul className="mt-4 divide-y divide-night-line">
        {SITE_DOMAINS.map((domain) => {
          const r = results[domain];
          return (
            <li key={domain} className="flex flex-wrap items-center gap-3 py-3">
              <a href={`https://${domain}/`} target="_blank" rel="noreferrer" className="inline-flex min-w-0 flex-1 items-center gap-1.5 font-mono text-[13px] text-electric-soft underline">
                {domain} <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
              </a>
              {r ? (
                <span className="flex items-center gap-1.5 text-[13px]">
                  {r.ok ? <Check className="h-4 w-4 text-fresh" aria-hidden /> : <XCircle className="h-4 w-4 text-overdue" aria-hidden />}
                  {r.status !== null ? <span className="font-mono">{r.status}</span> : null}
                  {r.redirectsTo ? <span className="text-night-muted">→ {r.redirectsTo}</span> : null}
                  <span className="text-night-muted">{r.ms}ms</span>
                  {r.error ? <span className="text-overdue">{r.error}</span> : null}
                </span>
              ) : (
                <span className="text-[13px] text-night-muted">Not checked</span>
              )}
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => run(domain)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-night-line px-3 text-[13px] disabled:opacity-60"
              >
                {busy === domain ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden />}
                Check
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[12px] text-night-muted">Live reachability from the server: HTTP status, redirect target and response time for each domain.</p>
    </section>
  );
}
