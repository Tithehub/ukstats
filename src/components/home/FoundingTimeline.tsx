import { ExternalLink } from "lucide-react";
import type { FoundingHistory } from "@/lib/founding-documents.data";

/** Earliest-to-latest timeline for one founding document. */
export function HistoryTimeline({ history, compact = false }: { history: FoundingHistory; compact?: boolean }) {
  return (
    <div className={compact ? "mt-2 text-xs" : "mt-3 text-sm"}>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Plain-English history · not legal advice · sources linked</p>
      {!compact && <p className="mt-2">{history.summary}</p>}
      <ol className="mt-2 space-y-2 border-l border-border pl-3">
        {history.timeline.map((e) => (
          <li key={e.year + e.title}>
            <p className="font-bold"><span className="font-mono text-primary">{e.year}</span> · {e.title}</p>
            <p className="text-muted-foreground">{e.text}</p>
            <a href={e.sourceHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">Source: {e.sourceLabel} <ExternalLink className="size-3" /></a>
          </li>
        ))}
      </ol>
      <p className="mt-2"><span className="font-semibold">In force today:</span> {history.inForce}</p>
    </div>
  );
}
