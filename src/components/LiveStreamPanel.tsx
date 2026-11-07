import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { LIVE_STREAM_ID, LIVE_STREAM_URL } from "@/lib/brand";
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
  return (
    <section aria-label="UKStats Live" className="mt-5 grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-[2fr_1fr]">
      <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
        {state === "blocked" ? (
          <a href={LIVE_STREAM_URL} target="_blank" rel="noopener noreferrer" className="absolute inset-0 grid place-items-center bg-primary p-6 text-center text-primary-foreground">
            <span className="relative grid gap-3 justify-items-center">
              <span className="text-xl font-black">Back shortly — watch on YouTube</span>
              <span className="inline-flex min-h-11 items-center gap-2 rounded-md bg-destructive px-5 font-bold text-destructive-foreground"><Play className="h-5 w-5" /> Open YouTube</span>
            </span>
          </a>
        ) : state === "on" ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${LIVE_STREAM_ID}?autoplay=1&mute=1&playsinline=1`}
            title="UKStats Live stream"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center bg-primary text-2xl font-black tracking-wide text-primary-foreground">UKSTATS LIVE</span>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span className="h-3 w-3 animate-pulse rounded-full bg-destructive" aria-hidden /> UKStats Live · 24/7
        </h2>
        <p className="text-sm text-muted-foreground">Plays muted — tap the player for sound. Even London hours cover the UK; odd hours tour other countries.</p>
        <p className="text-sm text-muted-foreground">Every figure on the stream comes from the official publisher, with its source and date.</p>
        <ShareRow path="/live" title="UKStats Live — official UK figures, 24/7" />
        <div className="mt-auto flex flex-wrap gap-2">
          {showLiveLink && (
            <Link to="/live" className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-4 font-semibold">Full-page live</Link>
          )}
          <a href={LIVE_STREAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 font-semibold text-primary-foreground">
            Watch on YouTube
          </a>
        </div>
      </div>
    </section>
  );
}
