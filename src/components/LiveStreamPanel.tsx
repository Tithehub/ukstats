import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play, Volume2 } from "lucide-react";
import { LIVE_STREAM_ID, YOUTUBE_CHANNEL_URL } from "@/lib/brand";
import { checkEmbeddable } from "@/lib/embed-check.functions";
import { ShareRow } from "@/components/ShareRow";

/** Live player: starts muted automatically after hydration (browsers block sound until a tap). */
export function LiveStreamPanel({ showLiveLink = true }: { showLiveLink?: boolean }) {
  const [state, setState] = useState<"idle" | "on" | "blocked">("idle");
  useEffect(() => {
    let alive = true;
    checkEmbeddable({ data: { id: LIVE_STREAM_ID } })
      .catch(() => ({ ok: true }))
      .then((r) => { if (alive) setState(r.ok ? "on" : "blocked"); });
    return () => { alive = false; };
  }, []);
  const frame = useRef<HTMLIFrameElement>(null);
  const [muted, setMuted] = useState(true);
  const send = (func: string) => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");
  useEffect(() => {
    if (state !== "on") return;
    const on = (e: MessageEvent) => {
      if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname)) return;
      try {
        const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (d?.info && typeof d.info.muted === "boolean") setMuted(d.info.muted);
      } catch { /* ignore */ }
    };
    addEventListener("message", on);
    const t = setInterval(() => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: "ukstats-live" }), "*"), 1000);
    return () => { removeEventListener("message", on); clearInterval(t); };
  }, [state]);
  return (
    <section aria-label="UKStats Live" className="mt-5 grid gap-4 rounded-lg border border-border bg-card p-4">
      <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
        {state === "blocked" ? (
          <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="absolute inset-0 grid place-items-center bg-primary p-6 text-center text-primary-foreground">
            <span className="relative grid gap-3 justify-items-center">
              <span className="text-xl font-black">Back shortly — watch on YouTube</span>
              <span className="inline-flex min-h-11 items-center gap-2 rounded-md bg-destructive px-5 font-bold text-destructive-foreground"><Play className="h-5 w-5" /> Open YouTube</span>
            </span>
          </a>
        ) : state === "on" ? (
          <>
            <iframe
              ref={frame}
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${LIVE_STREAM_ID}?autoplay=1&mute=0&playsinline=1&enablejsapi=1`}
              title="UKStats Live stream"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
            {muted && (
              <button type="button" onClick={() => { send("unMute"); send("playVideo"); setMuted(false); }}
                className="absolute left-3 top-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-destructive px-4 font-bold text-destructive-foreground shadow-lg">
                <Volume2 className="h-5 w-5" /> Tap for sound
              </button>
            )}
          </>
        ) : (
          <span className="absolute inset-0 grid place-items-center bg-primary text-2xl font-black tracking-wide text-primary-foreground">UKSTATS LIVE</span>
        )}
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-2 md:max-w-[55%]">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span className="h-3 w-3 animate-pulse rounded-full bg-destructive" aria-hidden /> UKStats Live · 24/7
        </h2>
        <p className="text-sm text-muted-foreground">Plays with sound — if your browser blocks it, press "Tap for sound". Even London hours cover the UK; odd hours tour other countries.</p>
        <p className="text-sm text-muted-foreground">Every figure on the stream comes from the official publisher, with its source and date.</p>
        </div>
        <div className="flex min-w-0 flex-col gap-3 md:items-end">
        <ShareRow path="/live" title="UKStats Live — official UK figures, 24/7" />
        <div className="flex flex-wrap gap-2">
          {showLiveLink && (
            <Link to="/live" className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 font-semibold">Full-page live</Link>
          )}
          <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 font-semibold text-primary-foreground">
            Watch on YouTube
          </a>
        </div>
        </div>
      </div>
    </section>
  );
}
