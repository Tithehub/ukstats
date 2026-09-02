import { useState } from "react";
import { SHARE_TARGETS, absoluteUrl } from "@/lib/share";

/** Share the current page, plus a direct link to the official source. */
export function ShareRow({
  path,
  title,
  sourceUrl,
  sourceLabel,
  className = "",
}: {
  path: string;
  title: string;
  sourceUrl?: string;
  sourceLabel?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = absoluteUrl(path);

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">Share</span>
      {SHARE_TARGETS.map((t) => (
        <a
          key={t.key}
          href={t.href(url, title)}
          target="_blank"
          rel="noreferrer noopener"
          className="rounded-md border border-night-line/60 px-2 py-1 font-mono text-[11px] text-night-muted transition-colors hover:border-electric hover:text-electric-soft"
        >
          {t.label}
        </a>
      ))}
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard?.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }}
        className="rounded-md border border-night-line/60 px-2 py-1 font-mono text-[11px] text-night-muted transition-colors hover:border-electric hover:text-electric-soft"
      >
        {copied ? "Link copied" : "Copy link"}
      </button>
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-electric/40 px-2 py-1 font-mono text-[11px] text-electric-soft hover:bg-electric/10"
        >
          {sourceLabel ?? "Official source"} ↗
        </a>
      ) : null}
    </div>
  );
}
