import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type ReactNode } from "react";
import { ArrowUpRight, Vote, BarChart3, FileText } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageLoading, PageLoadError } from "@/components/layout/PageFeedback";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ShareRow } from "@/components/ShareRow";
import { getPolling } from "@/lib/uk-stats.functions";
import { fmtDate, ageLabel } from "@/lib/uk-stats";
import { rankParties, rankHeadlinePoll, recentPartyPolls, PARTY_TOPICS, type PartyTopic } from "@/lib/party-comparison";
import { ELECTION_PARTIES, MANIFESTOS, ELECTION_SOURCE, ELECTION_DATE, PARTY_EVIDENCE_CHECKED } from "@/lib/party-comparison.data";

const pollingQuery = queryOptions({ queryKey: ["party-polling"], queryFn: () => getPolling(), staleTime: 60 * 60_000 });
const title = "UK political parties: polls, election ranks & policies — UKStats";
const description = "Compare the main UK parties by published voting-intention polls, 2024 election seats and vote share, and dated manifesto pledges. Every comparison links to its source.";
type ComparisonView = "election" | "polls" | "policies";

export const Route = createFileRoute("/parties")({
  validateSearch: (search: Record<string, unknown>): { view: ComparisonView } => ({
    view: search["view"] === "polls" || search["view"] === "policies" ? search["view"] : "election",
  }),
  loaderDeps: ({ search }) => ({ view: search.view }),
  loader: async ({ context, deps }) => {
    const now = Date.now();
    if (deps.view !== "polls") return { polling: null, now };
    try { return { polling: await context.queryClient.ensureQueryData(pollingQuery), now }; }
    catch { return { polling: null, now }; }
  },
  pendingComponent: PageLoading,
  errorComponent: PageLoadError,
  head: () => ({
    meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { property: "og:url", content: "https://ukstats.co.uk/parties" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://ukstats.co.uk/parties" }],
  }),
  component: PartiesPage,
});

function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-electric-soft underline underline-offset-4">{children}<ArrowUpRight className="size-3 shrink-0" aria-hidden="true" /></a>;
}

function PartiesPage() {
  const { polling: loadedPolling, now } = Route.useLoaderData();
  const { view } = Route.useSearch();
  const fetchPolling = useServerFn(getPolling);
  const pollingResult = useQuery({ ...pollingQuery, queryFn: () => fetchPolling(), enabled: view === "polls", ...(loadedPolling ? { initialData: loadedPolling } : {}) });
  const polling = pollingResult.data ?? loadedPolling;
  const navigate = Route.useNavigate();
  const [order, setOrder] = useState<"seats" | "votes">("seats");
  const [topic, setTopic] = useState<PartyTopic>("immigration");
  const [selectedPoll, setSelectedPoll] = useState("");
  const [selectedParties, setSelectedParties] = useState<string[]>(ELECTION_PARTIES.map(party => party.id));
  const polls = polling ? recentPartyPolls(polling.polls, now, polling.windowDays) : [];
  const poll = polls.find(p => p.pollster === selectedPoll) ?? polls[0];
  const rows = rankParties(ELECTION_PARTIES, party => order === "seats" ? party.seats : party.voteShare);

  return <div className="min-h-dvh bg-night text-night-fg">
    <SiteHeader />
    <main id="main-content" className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
      <p className="font-mono text-xs uppercase text-night-muted">Politics & polling</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">UK political parties</h1>
      <p className="mt-3 max-w-3xl text-night-muted">Who won seats, who won votes, and what each party promised. Election results are official records; polls measure voting intention; manifestos are proposals, not delivery scores.</p>
      <p className="mt-3 text-xs text-night-muted">Seven main parties in Great Britain. SNP stands in Scotland; Plaid Cymru in Wales. Northern Ireland parties and other parties are in the <SourceLink href={ELECTION_SOURCE}>full Parliament results</SourceLink>.</p>
      <Tabs value={view} onValueChange={value => void navigate({ search: { view: value === "polls" || value === "policies" ? value : "election" } })} className="mt-8">
        <TabsList aria-label="Party comparison" className="grid h-auto w-full grid-cols-3 gap-1 sm:inline-flex sm:w-auto">
          <TabsTrigger value="election" className="min-h-11 gap-2"><Vote className="hidden size-4 sm:block" />2024 result</TabsTrigger>
          <TabsTrigger value="polls" className="min-h-11 gap-2"><BarChart3 className="hidden size-4 sm:block" />Latest polls</TabsTrigger>
          <TabsTrigger value="policies" className="min-h-11 gap-2"><FileText className="hidden size-4 sm:block" />Policies</TabsTrigger>
        </TabsList>
        <TabsContent value="election" className="pt-6">
          <h2 className="text-xl font-semibold">2024 election rankings</h2>
          <p className="mt-2 text-sm text-night-muted">4 July 2024 · Seats won at the election, not today’s Commons membership. Vote shares use all valid UK votes; ranks compare the seven parties shown.</p>
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Rank election results by">
            <Button variant={order === "seats" ? "default" : "outline"} aria-pressed={order === "seats"} onClick={() => setOrder("seats")}>Seats won</Button>
            <Button variant={order === "votes" ? "default" : "outline"} aria-pressed={order === "votes"} onClick={() => setOrder("votes")}>Vote share</Button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <caption className="sr-only">2024 election result ranked by {order === "seats" ? "seats won" : "UK vote share"}</caption>
              <thead className="border-y border-night-line text-left text-night-muted"><tr><th className="py-3 pr-4">Rank</th><th className="py-3">Party</th><th className="py-3 text-right">Seats</th><th className="py-3 text-right">UK vote share</th></tr></thead>
              <tbody>{rows.map(({ party, rank }) => <tr key={party.id} className="border-b border-night-line/60"><td className="py-4 font-mono text-night-muted">{rank}</td><th scope="row" className="py-4 text-left font-medium">{party.name}<span className="mt-1 block text-xs font-normal text-night-muted">{party.area}</span></th><td className="py-4 text-right font-mono text-lg">{party.seats}</td><td className="py-4 text-right font-mono">{party.voteShare.toFixed(1)}%</td></tr>)}</tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-night-muted">Reference: {fmtDate(ELECTION_DATE)} · Data age: {ageLabel(ELECTION_DATE, now)} · Checked: {fmtDate(PARTY_EVIDENCE_CHECKED)} · Next result: no election date announced.</p>
          <p className="mt-2 text-sm"><SourceLink href={ELECTION_SOURCE}>UK Parliament · published party results</SourceLink></p>
          <p className="mt-2 text-xs text-night-muted">Green Party here means the Green Party of England and Wales; Scottish Greens are separate. Constituency elections do not allocate seats in proportion to UK vote share.</p>
        </TabsContent>
        <TabsContent value="polls" className="pt-6">
          <h2 className="text-xl font-semibold">Published voting-intention polls</h2>
          <p className="mt-2 text-sm text-night-muted">Each poll is shown separately, without modelling or an estimated average. Latest readable releases within {polling?.windowDays ?? 21} days. Polls are not election results.</p>
          {poll ? <>
            <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Choose a pollster">{polls.map(p => <Button key={p.pollster} variant={p.pollster === poll.pollster ? "default" : "outline"} aria-pressed={p.pollster === poll.pollster} onClick={() => setSelectedPoll(p.pollster)}>{p.pollster}</Button>)}</div>
            <p className="mt-4 text-sm text-night-muted">{poll.pollster} · Fieldwork ended {fmtDate(poll.fieldworkEnd)} · {ageLabel(poll.fieldworkEnd, now)} · Sample: {poll.sampleSize?.toLocaleString("en-GB") ?? "not stated"} · Next release: no date announced.</p>
            <ol className="mt-4 divide-y divide-night-line">{rankHeadlinePoll(poll.shares).map(({ party, rank }) => <li key={party.name} className="flex items-center gap-4 py-4"><span className="w-6 font-mono text-night-muted">{rank}</span><span className="flex-1">{party.name}</span><span className="font-mono text-xl">{party.share}%</span></li>)}</ol>
            <p className="mt-3 text-sm"><SourceLink href={poll.url}>Read this poll’s original release</SourceLink></p>
            <p className="mt-3 text-xs text-night-muted">Only published headline shares are ranked. SNP and Plaid Cymru are excluded here because Scotland/Wales figures are not interchangeable with GB voting intention. Publication date and fieldwork start are not available in the connected feed.</p>
          </> : <div role="status" className="mt-5 border-l-2 border-ageing py-3 pl-4"><h3 className="font-semibold">No live feed</h3><p className="mt-1 text-sm text-night-muted">No recent pollster release could be verified from the connected feed. No current ranking is shown.</p></div>}
          <p className="mt-5 text-xs text-night-muted">Feed checked: {polling ? fmtDate(polling.fetchedAt) : "unavailable"}.</p>
          {polling?.unavailable.length ? <ul className="mt-3 space-y-2 text-sm text-night-muted">{polling.unavailable.map(p => <li key={p.pollster}><SourceLink href={p.url}>{p.pollster}</SourceLink> — {p.reason}</li>)}</ul> : null}
          <Button asChild variant="outline" className="mt-5"><Link to="/polling">Polling sources & party register</Link></Button>
        </TabsContent>
        <TabsContent value="policies" className="pt-6">
          <h2 className="text-xl font-semibold">What the parties pledged in 2024</h2>
          <p className="mt-2 text-sm text-night-muted">Dated manifesto summaries, not current-policy claims or endorsement. Health and housing powers are devolved, so each pledge’s scope differs. No party receives a “best policy” score.</p>
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Policy topic">{PARTY_TOPICS.map(t => <Button key={t.id} variant={topic === t.id ? "default" : "outline"} aria-pressed={topic === t.id} onClick={() => setTopic(t.id)}>{t.label}</Button>)}</div>
          <fieldset className="mt-5"><legend className="text-xs text-night-muted">Parties in the comparison</legend><div className="mt-2 flex flex-wrap gap-x-5 gap-y-3">{ELECTION_PARTIES.map(p => <label key={p.id} className="flex min-h-8 items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={selectedParties.includes(p.id)} onChange={event => setSelectedParties(current => event.target.checked ? [...current, p.id] : current.filter(id => id !== p.id))} />{p.name}</label>)}</div></fieldset>
          <div className="mt-5 grid gap-4 md:grid-cols-2">{ELECTION_PARTIES.filter(p => selectedParties.includes(p.id)).map(p => {
            const evidence = MANIFESTOS[p.id];
            return <article key={p.id} className="rounded-md border border-night-line bg-night-panel p-5"><h3 className="font-semibold">{p.name}</h3><p className="mt-1 font-mono text-xs text-night-muted">{evidence?.reference ?? "2024 election"}</p><p className="mt-4 text-sm leading-relaxed">{evidence?.positions[topic] ?? "Policy summary unavailable: the primary manifesto text could not be verified. No position is inferred."}</p>{evidence ? <p className="mt-4 text-xs"><SourceLink href={evidence.url}>Original party manifesto</SourceLink></p> : null}</article>;
          })}</div>
          {!selectedParties.length ? <p role="status" className="py-8 text-night-muted">No parties selected.</p> : null}
          <p className="mt-5 text-xs text-night-muted">Reference period: 2024 general election · Checked {fmtDate(PARTY_EVIDENCE_CHECKED)} · Historical pledges are not refreshed into current policies. Next manifesto publication: no date announced.</p>
        </TabsContent>
      </Tabs>
      <div className="mt-10 border-t border-night-line pt-6"><ShareRow title="UK political party comparison — UKStats" path={`/parties?view=${view}`} /></div>
    </main>
    <SiteFooter />
  </div>;
}