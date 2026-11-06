import { useEffect, useRef, useState } from "react";
import presenter from "@/assets/stream/ukstats_presenter.jpg.asset.json";
import { speakLine } from "@/lib/speech.functions";

/** AI presenter box: reads the given line aloud (only when voice is on) and is always labelled as AI. */
export function Presenter({ line, voice }: { line: string; voice: boolean }) {
  const [speaking, setSpeaking] = useState(false);
  const el = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!voice || !line) return;
    let stop = false;
    speakLine({ data: { text: line } }).then((r) => {
      if (stop || !r.audio) return;
      el.current?.pause();
      const a = new Audio(`data:audio/wav;base64,${r.audio}`);
      el.current = a;
      a.onplay = () => setSpeaking(true);
      a.onended = a.onpause = () => setSpeaking(false);
      a.play().catch(() => setSpeaking(false));
    }).catch(() => {});
    return () => { stop = true; el.current?.pause(); };
  }, [line, voice]);
  return <div className="relative h-full w-full overflow-hidden rounded border-2 border-night-line bg-night">
    <img src={presenter.url} alt="AI presenter" className={`h-full w-full object-cover transition-transform duration-[9000ms] ease-linear ${speaking ? "scale-110" : "scale-100"}`} />
    <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-primary px-3 py-1 text-primary-foreground">
      <span className={`inline-block size-3 rounded-full ${speaking ? "bg-destructive motion-safe:animate-pulse" : "bg-night-muted"}`} />
      <span className="truncate font-mono text-[18px] font-bold uppercase tracking-wider">AI presenter · reads official figures only</span>
    </div>
  </div>;
}
