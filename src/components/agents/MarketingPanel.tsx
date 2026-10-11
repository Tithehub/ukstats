import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, ExternalLink, Megaphone, Send, X } from "lucide-react";
import { listAgentPosts, reviewAgentPost } from "@/lib/agents.functions";
import { listSocialAccounts, postToSocialAccounts } from "@/lib/social.functions";

const composer = (platform: string, body: string) =>
  platform === "bluesky" ? `https://bsky.app/intent/compose?text=${encodeURIComponent(body)}` : `https://mastodon.social/share?text=${encodeURIComponent(body)}`;

export function MarketingPanel() {
  const qc = useQueryClient();
  const list = useServerFn(listAgentPosts);
  const review = useServerFn(reviewAgentPost);
  const accounts = useServerFn(listSocialAccounts);
  const post = useServerFn(postToSocialAccounts);
  const q = useQuery({ queryKey: ["agent-posts"], queryFn: () => list() });
  const acc = useQuery({ queryKey: ["social-accounts"], queryFn: () => accounts() });
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["agent-posts"] });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myAccounts = ((acc.data as any)?.accounts ?? acc.data ?? []) as { id: string; platform: string; label: string }[];

  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-2 text-xl font-semibold"><Megaphone className="h-5 w-5 text-electric" aria-hidden /> Marketing drafts ({q.data?.length ?? 0})</h2>
      <p className="mt-1 text-[14px] text-night-muted">Written each night from published figures only. Nothing is posted until you approve it.</p>
      {msg ? <p className="mt-2 text-[13px] text-electric-soft">{msg}</p> : null}
      <div className="mt-3 space-y-3">
        {(q.data ?? []).map((p) => {
          const body = edits[p.id] ?? p.body;
          const targets = Array.isArray(myAccounts) ? myAccounts.filter((a) => a.platform === p.platform) : [];
          return (
            <article key={p.id} className="rounded-xl border border-night-line bg-night-panel p-4">
              <p className="font-mono text-[11px] uppercase text-night-muted">{p.platform} · {p.kind.replace("_", " ")} · {p.status}</p>
              <textarea aria-label="Post text" value={body} onChange={(e) => setEdits({ ...edits, [p.id]: e.target.value })} rows={4} className="mt-2 w-full rounded-lg border border-night-line bg-night p-2 text-[14px]" />
              <div className="mt-2 flex flex-wrap gap-2">
                {p.status === "pending" ? (
                  <>
                    <button type="button" onClick={async () => { await review({ data: { id: p.id, status: "approved", body } }); refresh(); }} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-fresh/20 px-4 text-fresh"><Check className="h-4 w-4" aria-hidden /> Approve</button>
                    <button type="button" onClick={async () => { await review({ data: { id: p.id, status: "rejected" } }); refresh(); }} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-night-line px-4"><X className="h-4 w-4" aria-hidden /> Reject</button>
                  </>
                ) : (
                  <>
                    {targets.length ? (
                      <button type="button" onClick={async () => {
                        const r = await post({ data: { accountIds: targets.map((t) => t.id), text: body, link: p.link } });
                        const ok = r.results.filter((x) => x.ok).length;
                        setMsg(`Posted to ${ok} of ${r.results.length} account(s).`);
                        if (ok) await review({ data: { id: p.id, status: "posted" } });
                        refresh();
                      }} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-electric px-4 text-night"><Send className="h-4 w-4" aria-hidden /> Post to my {p.platform}</button>
                    ) : null}
                    <a href={composer(p.platform, body)} target="_blank" rel="noreferrer" onClick={() => review({ data: { id: p.id, status: "posted" } }).then(refresh)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-night-line px-4"><ExternalLink className="h-4 w-4" aria-hidden /> Open composer</a>
                  </>
                )}
                <button type="button" onClick={() => navigator.clipboard.writeText(body)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-night-line px-4"><Copy className="h-4 w-4" aria-hidden /> Copy</button>
              </div>
            </article>
          );
        })}
        {!q.data?.length ? <p className="text-night-muted">No drafts yet — they appear after tonight's run.</p> : null}
      </div>
    </section>
  );
}

const SHOW_HN = `Show HN: UKStats – every UK official statistic with its source, age and next release date

I built https://ukstats.co.uk to put UK official figures (ONS, Home Office, MOD, Police.uk, Land Registry and more) in one place. Each figure shows who published it, the reference period, how old it is and when the next release is due. Where a publisher has no machine-readable feed it says so instead of estimating.

There's a free JSON/CSV API with no sign-up (https://ukstats.co.uk/api-docs), a release calendar, and a public log of figures publishers quietly revise.

Feedback on sources I've missed or got wrong is very welcome.`;

const APD = `---
title: UKStats – UK National Data Register
homepage: https://ukstats.co.uk/api-docs
category: Government
description: Free JSON/CSV API of UK official statistics (ONS, Home Office, MOD, Police.uk, HM Land Registry) with source, reference period and next release date for every figure.
version: v1.0`;

const PITCH = `Hi [name],

I follow your work on data journalism and thought this might be useful for your readers or students: https://ukstats.co.uk

It collects UK official figures in one place and shows the source, period, age and next release date for each, with a free API and a log of publisher revisions. No ads, no sign-up.

Would you be willing to take a look and tell me what's missing or wrong?

Thanks,
Marco`;

function Kit({ title, how, text, link }: { title: string; how: string; text: string; link: string }) {
  return (
    <article className="rounded-xl border border-night-line bg-night-panel p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-[13px] text-night-muted">{how}</p>
      <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-night p-3 text-[13px]">{text}</pre>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => navigator.clipboard.writeText(text)} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-night-line px-4"><Copy className="h-4 w-4" aria-hidden /> Copy</button>
        <a href={link} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-night-line px-4"><ExternalLink className="h-4 w-4" aria-hidden /> Open</a>
      </div>
    </article>
  );
}

export function LaunchKit() {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">Launch kit — send these yourself</h2>
      <p className="mt-1 text-[14px] text-night-muted">These places don't allow automated posting, so each is ready to copy and send by hand.</p>
      <div className="mt-3 space-y-3">
        <Kit title="Show HN post" how="Post from your own Hacker News account. Lead with the free API; don't mention donations (their rules ban fundraisers)." text={SHOW_HN} link="https://news.ycombinator.com/submit" />
        <Kit title="awesome-public-datasets listing" how="Add this as a new YAML file under core/Government in a pull request to awesomedata/apd-core." text={APD} link="https://github.com/awesomedata/apd-core/blob/master/CONTRIBUTING.md" />
        <Kit title="Personal pitch to data journalists" how="Send individually to people like Paul Bradshaw (Online Journalism Blog), SA Mathieson (Making the numbers) or Full Fact. Change the first line for each person." text={PITCH} link="https://onlinejournalismblog.com/" />
        <Kit title="Bluesky accounts to follow and reply to" how="Follow these data-journalism starter packs, and reply with a sourced figure when a release they post about comes out." text={"Data Journalism starter pack: https://theblue.social/starter-packs/46261\nData Journalism UK and the world: https://blueskydirectory.com/starter-packs/a/342786-data-journalism-uk-and-the-world\nUK Data Service pack: https://theblue.social/starter-packs/128316"} link="https://theblue.social/starter-packs/46261" />
      </div>
    </section>
  );
}
