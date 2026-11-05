import { useState } from "react";
import { Play } from "lucide-react";
import { LIVE_STREAM_ID, LIVE_STREAM_URL } from "@/lib/brand";

export function LiveStreamPanel() {
  const [on, setOn] = useState(false);
  return (
    <section aria-label="UKStats Live" className="mt-5 grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-[2fr_1fr]">
      <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
        {on ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${LIVE_STREAM_ID}?autoplay=1&mute=1`}
            title="UKStats Live stream"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <button type="button" onClick={() => setOn(true)} className="group absolute inset-0 h-full w-full" aria-label="Play the UKStats live stream">
            <img src={`https://i.ytimg.com/vi/${LIVE_STREAM_ID}/hqdefault_live.jpg`} alt="" loading="lazy" className="h-full w-full object-cover" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition group-hover:scale-110">
                <Play className="h-8 w-8" />
              </span>
            </span>
          </button>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <span className="h-3 w-3 animate-pulse rounded-full bg-destructive" aria-hidden /> UKStats Live
        </h2>
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">What's on now:</strong> the UK hour runs on even London hours; odd hours tour other countries.
        </p>
        <p className="text-sm text-muted-foreground">Every figure on the stream comes from the official publisher, with its source and date.</p>
        <a href={LIVE_STREAM_URL} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 font-semibold text-primary-foreground">
          Watch on YouTube
        </a>
      </div>
    </section>
  );
}
