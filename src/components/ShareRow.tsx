import { useEffect, useState } from "react";
import { Check, ExternalLink, Link2, Share2 } from "lucide-react";
import { SHARE_TARGETS, SITE_ORIGIN, absoluteUrl } from "@/lib/share";
import { btn } from "@/lib/ui";
import { Button } from "@/components/ui/button";

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
  const [copyError, setCopyError] = useState(false);
  // Render the canonical URL first so SSR and hydration agree, then switch to
  // the origin the visitor is actually on.
  const [url, setUrl] = useState(`${SITE_ORIGIN}${path}`);
  useEffect(() => setUrl(absoluteUrl(path)), [path]);

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="mr-1 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-night-muted">
        <Share2 className="size-3.5" aria-hidden="true" />
        Share
      </span>
      {SHARE_TARGETS.map((t) => (
        <a
          key={t.key}
          href={t.href(url, title)}
          target="_blank"
          rel="noreferrer noopener"
          title={`Share on ${t.label}`}
          aria-label={`Share on ${t.label}`}
          className={btn("toggle", "sm", "px-2.5")}
        >
          <t.icon className="size-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">{t.label}</span>
        </a>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setCopyError(false);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            setCopyError(true);
          }
        }}
      >
        {copied ? <Check className="size-4" aria-hidden="true" /> : <Link2 className="size-4" aria-hidden="true" />}
        {copied ? "Link copied" : "Copy link"}
      </Button>
      {copyError && <span role="alert" className="break-all text-xs text-night-muted">Couldn’t copy. Page link: {url}</span>}
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className={btn("secondary", "sm", "border-electric/40 text-electric-soft hover:bg-electric/10")}
        >
          <ExternalLink className="size-4" aria-hidden="true" />
          {sourceLabel ?? "Official source"}
        </a>
      ) : null}
    </div>
  );
}
