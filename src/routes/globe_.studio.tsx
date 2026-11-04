import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { STREAM_DESCRIPTION, STREAM_TITLE, STUDIO_CHECKLIST } from "@/lib/stream-copy";

export const Route = createFileRoute("/globe_/studio")({
  head: () => ({ meta: [
    { title: "UKStats stream studio — preview the live broadcast" },
    { name: "description", content: "Preview exactly what the UKStats YouTube live stream shows before going live." },
    { property: "og:title", content: "UKStats stream studio" },
    { property: "og:description", content: "Preview the UKStats live globe broadcast at 1920×1080." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  component: StudioPage,
});

const KEY = "ukstats-studio-checklist";

function CopyBox({ label, text }: { label: string; text: string }) {
  const [msg, setMsg] = useState("");
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setMsg("Copied"); } catch { setMsg("Copy failed — select the text instead"); }
    setTimeout(() => setMsg(""), 2500);
  };
  return <div className="space-y-1">
    <div className="flex items-center justify-between text-sm font-semibold">{label}
      <button onClick={copy} className="rounded border border-border px-2 py-0.5 text-xs hover:bg-muted">{msg || "Copy"}</button>
    </div>
    <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 font-mono text-xs">{text}</pre>
  </div>;
}

function StudioPage() {
  const wrap = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [guides, setGuides] = useState(true);
  const [fits, setFits] = useState(true);
  useEffect(() => {
    const on = (e: MessageEvent) => { if (e.origin === location.origin && e.data?.type === "ukstats-stream-fit") setFits(!!e.data.ok); };
    addEventListener("message", on); return () => removeEventListener("message", on);
  }, []);
  const [done, setDone] = useState<boolean[]>(() => STUDIO_CHECKLIST.map(() => false));

  useEffect(() => {
    try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); if (Array.isArray(v)) setDone(STUDIO_CHECKLIST.map((_, i) => !!v[i])); } catch { /* ignore */ }
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / 1920));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const toggle = (i: number) => setDone((d) => { const n = d.map((x, j) => (j === i ? !x : x)); localStorage.setItem(KEY, JSON.stringify(n)); return n; });

  return <div className="min-h-dvh bg-background p-4 text-foreground">
    <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div><h1 className="text-xl font-bold">Stream studio</h1>
        <p className="text-sm text-muted-foreground">Live preview at 1920×1080 — exactly what YouTube viewers will see.</p></div>
      <div className="flex gap-2">
        <button onClick={() => setGuides((g) => !g)} className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted">{guides ? "Hide" : "Show"} YouTube safe areas</button>
        <a href="/globe/broadcast" target="_blank" rel="noopener" className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground">Open full-size stream page</a>
      </div>
    </header>
    {!fits && <p role="alert" className="mb-3 rounded border border-destructive bg-destructive/10 px-3 py-2 text-sm">Something is cut off in the stream's right panel — tell us which segment and we'll shorten it.</p>}
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div ref={wrap} className="relative w-full overflow-hidden rounded border border-border bg-muted" style={{ aspectRatio: "16 / 9" }}>
        <iframe title="Live stream preview" src="/globe/broadcast" className="absolute left-0 top-0 origin-top-left border-0"
          style={{ width: 1920, height: 1080, transform: `scale(${scale})` }} />
        {guides && <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-[9%] border-b-2 border-dashed border-destructive/70 bg-destructive/10"><span className="m-1 inline-block rounded bg-background/80 px-1 text-[10px]">YouTube title bar</span></div>
          <div className="absolute inset-x-0 bottom-0 h-[11%] border-t-2 border-dashed border-destructive/70 bg-destructive/10"><span className="m-1 inline-block rounded bg-background/80 px-1 text-[10px]">YouTube player controls</span></div>
        </div>}
      </div>
      <aside className="space-y-4">
        <section className="rounded border border-border p-3">
          <h2 className="mb-2 font-semibold">Go-live checklist</h2>
          <ol className="space-y-1.5 text-sm">{STUDIO_CHECKLIST.map((t, i) => <li key={t}>
            <label className="flex cursor-pointer gap-2"><input type="checkbox" checked={done[i]} onChange={() => toggle(i)} /><span className={done[i] ? "line-through text-muted-foreground" : ""}>{i + 1}. {t}</span></label>
          </li>)}</ol>
          <p className="mt-2 text-xs text-muted-foreground">Ticks are saved on this device only. The site never holds your stream key.</p>
        </section>
        <section className="space-y-3 rounded border border-border p-3">
          <CopyBox label="YouTube title" text={STREAM_TITLE} />
          <CopyBox label="YouTube description" text={STREAM_DESCRIPTION} />
        </section>
      </aside>
    </div>
  </div>;
}
