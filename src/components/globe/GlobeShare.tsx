import { useEffect, useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import { SHARE_TARGETS } from "@/lib/share";

/** Compact share menu for the current globe view; closed until tapped so it never covers the globe. */
export function GlobeShare({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);
  useEffect(() => { if (open) setUrl(window.location.href); }, [open]);
  return <div className="relative shrink-0">
    <button type="button" aria-label="Share this view" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="inline-flex min-h-8 items-center rounded border border-night-line px-2 hover:bg-night"><Share2 className="size-3.5" /></button>
    {open && <div role="menu" onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }} className="absolute right-0 top-10 z-40 w-44 rounded-md border border-night-line bg-night-panel p-1 text-xs shadow-2xl">
      {SHARE_TARGETS.map((t) => <a key={t.key} role="menuitem" href={t.href(url, title)} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-night"><t.icon className="size-3.5" />{t.label}</a>)}
      <button role="menuitem" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-night" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied("ok"); setTimeout(() => setCopied(null), 1800); } catch { setCopied("fail"); } }}>
        {copied === "ok" ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}{copied === "ok" ? "Link copied" : "Copy link"}</button>
      {copied === "fail" && <p role="alert" className="break-all px-2 py-1 text-night-muted">Couldn’t copy: {url}</p>}
    </div>}
  </div>;
}
