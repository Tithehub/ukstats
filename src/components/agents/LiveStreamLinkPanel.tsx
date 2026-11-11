import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Radio } from "lucide-react";
import { liveStreamQuery, setLiveStreamId } from "@/lib/live-stream.functions";

/** Admin box: paste a YouTube live link to change the homepage and /live player. */
export function LiveStreamLinkPanel() {
  const qc = useQueryClient();
  const q = useQuery(liveStreamQuery);
  const save = useServerFn(setLiveStreamId);
  const [link, setLink] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const m = useMutation({
    mutationFn: (l: string) => save({ data: { link: l } }),
    onSuccess: (r) => {
      if (r.ok) { setMsg({ ok: true, text: `Saved — homepage and /live now play ${r.id}.` }); setLink(""); qc.invalidateQueries({ queryKey: liveStreamQuery.queryKey }); }
      else setMsg({ ok: false, text: r.error });
    },
    onError: (e) => setMsg({ ok: false, text: e instanceof Error ? e.message : "Couldn't save" }),
  });
  const id = q.data?.id;
  return (
    <section className="mt-8 rounded-xl border border-night-line bg-night-panel p-5">
      <h2 className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-night-muted"><Radio className="h-4 w-4" aria-hidden /> Homepage livestream</h2>
      {id ? (
        <div className="mt-3 flex items-center gap-3">
          <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="Current stream thumbnail" className="h-16 w-28 rounded object-cover" />
          <div className="text-sm">
            <p>Now playing: <a className="text-electric-soft underline" href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer">{id}</a></p>
            {q.data?.updatedAt ? <p className="text-night-muted">Changed {new Date(q.data.updatedAt).toLocaleString("en-GB", { timeZone: "Europe/London" })}</p> : null}
          </div>
        </div>
      ) : null}
      <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); setMsg(null); if (link.trim()) m.mutate(link.trim()); }}>
        <label htmlFor="live-link" className="sr-only">New YouTube live link</label>
        <input id="live-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://www.youtube.com/live/..." className="min-h-11 flex-1 rounded-lg border border-night-line bg-night px-3 text-sm" />
        <button type="submit" disabled={m.isPending || !link.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-electric px-4 font-medium text-night disabled:opacity-60">
          {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null} Save
        </button>
      </form>
      {msg ? <p className={`mt-2 text-sm ${msg.ok ? "text-fresh" : "text-overdue"}`}>{msg.text}</p> : null}
      <p className="mt-2 text-xs text-night-muted">Make sure embedding is on in YouTube Studio. Visitors see the change within a minute — no publishing needed.</p>
    </section>
  );
}
