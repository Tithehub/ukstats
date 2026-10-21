import { COVERAGE_PRIORITIES, DRAFT_REVIEW } from "@/lib/morning-review";
import { ANSWER_TOPICS } from "@/lib/answer-topics";
import { Link } from "@tanstack/react-router";

export function MorningReviewPanel() {
  return <section className="mt-8 border-t border-night-line pt-6">
    <h2 className="text-xl font-semibold">Approved work: source and draft review</h2>
    <p className="mt-2 text-sm text-night-muted">Sources rechecked 21 October 2026. Draft decisions are recorded separately in the queue; social posting remains manual.</p>
    <h3 className="mt-6 font-semibold">Country coverage priorities</h3>
    <ol className="mt-3 divide-y divide-night-line">{COVERAGE_PRIORITIES.map((item, index) => <li key={item.title} className="py-4"><a href={item.url} target="_blank" rel="noreferrer" className="text-electric-soft underline">{index + 1}. {item.title}</a><p className="mt-2 text-sm text-night-muted">{item.detail}</p></li>)}</ol>
    <h3 className="mt-6 font-semibold">Ten social drafts and two latest explainers</h3>
    <ul className="mt-3 divide-y divide-night-line">{DRAFT_REVIEW.map(item => <li key={item.title} className="py-4"><p className="font-medium">{item.title}</p><p className="mt-2 text-sm text-night-muted">{item.result}</p></li>)}</ul>
    <h3 className="mt-6 font-semibold">Answers supported by actual Google searches</h3>
    <ul className="mt-3 space-y-3">{ANSWER_TOPICS.map(topic => <li key={topic.slug}><Link to="/answers/$question" params={{ question: topic.slug }} className="text-electric-soft underline">{topic.title}</Link><p className="mt-1 text-xs text-night-muted">Search evidence: {topic.evidence} · report period 18 September–17 October 2026.</p></li>)}</ul>
    <p className="mt-5 text-sm"><Link to="/world-compare" search={{ countries: "GBR,FRA,USA" }} className="text-electric-soft underline">Compare two or three countries →</Link></p>
  </section>;
}