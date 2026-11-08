import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getMyReviewLinks, saveReviewLinks } from "@/lib/review-links.functions";
import { REVIEW_EXAMPLES, REVIEW_LABELS, REVIEW_PLATFORMS } from "@/lib/review-links";

const field = "mt-1 w-full rounded-md border border-night-line bg-night-panel px-3 py-2";
const STATUS: Record<string, string> = { pending: "Waiting for approval", approved: "Live in the directory", rejected: "Not approved — check the link" };

/** Sponsor's own review-profile links. Links only, no scripts; each change waits for admin approval. */
export function ReviewLinksForm({ sponsorId }: { sponsorId: string }) {
  const load = useServerFn(getMyReviewLinks);
  const save = useServerFn(saveReviewLinks);
  const qc = useQueryClient();
  const key = ["my-review-links", sponsorId];
  const q = useQuery({ queryKey: key, queryFn: () => load({ data: { sponsorId } }) });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!q.data) return <p className="mt-6 text-sm text-night-muted">Loading review profiles…</p>;
  const by = new Map(q.data.map((r) => [r.platform, r]));
  return (
    <form
      className="mt-8 grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true); setMsg(null);
        try {
          const r = await save({ data: { sponsorId, links: Object.fromEntries(REVIEW_PLATFORMS.map((p) => [p, String(f.get(p) ?? "")])) } });
          setMsg("error" in r ? r.error : "Saved — we'll check your links and switch them on.");
          await qc.invalidateQueries({ queryKey: key });
        } catch { setMsg("Couldn't save your links."); } finally { setBusy(false); }
      }}
    >
      <div className="sm:col-span-2">
        <h3 className="text-base font-semibold">Review profiles</h3>
        <p className="mt-1 text-xs text-night-muted">Add links to your own review pages. They appear as badges on your Business Directory listing after we approve them. Leave a box empty to remove it.</p>
      </div>
      {REVIEW_PLATFORMS.map((p) => (
        <label key={p} className="text-sm">
          {REVIEW_LABELS[p]}
          <input name={p} type="url" inputMode="url" maxLength={500} placeholder={REVIEW_EXAMPLES[p]} defaultValue={by.get(p)?.url ?? ""} className={field} />
          {by.get(p) ? <span className="mt-1 block text-xs text-night-muted">{STATUS[by.get(p)!.status] ?? ""}</span> : null}
        </label>
      ))}
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button disabled={busy} className="bg-electric text-night">{busy ? "Saving…" : "Save review links"}</Button>
        {msg ? <span role="status" className="text-sm text-night-muted">{msg}</span> : null}
      </div>
    </form>
  );
}
