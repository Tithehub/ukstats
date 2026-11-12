import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtFact, questionText, rankAnswer, scoreQuestion, type Answer, type Fact, type Question } from "@/lib/games";
import { WORLD_SOURCE } from "@/lib/world";

const Flag = ({ f }: { f: Fact }) => f.iso2 ? <img src={`https://flagcdn.com/w80/${f.iso2.toLowerCase()}.png`} alt="" width={40} height={27} loading="lazy" className="h-[27px] w-10 rounded-sm object-cover ring-1 ring-night-line" /> : null;
const Year = ({ f }: { f: Fact }) => !f.year ? null : <span className="font-mono text-[11px] text-night-muted">{f.year}</span>;

/** One question: player answers, then sees the real figure, its year and the source. */
export function QuestionCard({ q, onDone }: { q: Question; onDone: (ans: Answer, points: number) => void }) {
  const [ans, setAns] = useState<Answer>(null);
  const done = ans !== null;
  const points = done ? scoreQuestion(q, ans) : 0;
  const lock = (a: Answer) => { if (!done) setAns(a); };

  return (
    <div className="rounded-lg border border-night-line bg-night-panel p-5">
      <p className="font-mono text-[11px] uppercase tracking-wider text-electric-soft">{q.ind.label}</p>
      <h2 className="mt-1 text-xl font-semibold">{questionText(q)}</h2>

      {q.kind === "hl" && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[q.a, q.b].map((f, i) => {
            const win = (i === 0 ? q.a.value > q.b.value : q.b.value > q.a.value);
            return (
              <button key={f.iso3} disabled={done} onClick={() => lock(i)} className={`flex items-center gap-3 rounded-md border p-4 text-left transition ${done ? (win ? "border-fresh bg-fresh/10" : "border-night-line opacity-70") : "border-night-line hover:border-electric-soft"} ${ans === i ? "ring-2 ring-electric-soft" : ""}`}>
                <Flag f={f} />
                <span className="flex-1"><span className="block font-medium">{f.name}</span>{done && <span className="font-mono text-lg">{fmtFact(f, q.ind)} <Year f={f} /></span>}</span>
              </button>
            );
          })}
        </div>
      )}

      {q.kind === "flag" && (
        <div className="mt-4">
          <img src={`https://flagcdn.com/w640/${q.a.iso2.toLowerCase()}.png`} alt="A national flag" width={320} height={213} className="mx-auto h-40 w-auto max-w-full rounded-md object-contain ring-1 ring-night-line sm:h-52" />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {q.choices.map((f, i) => {
              const right = f.iso3 === q.a.iso3;
              return <button key={f.iso3} disabled={done} onClick={() => lock(i)} className={`rounded-md border p-3 text-left font-medium transition ${done ? (right ? "border-fresh bg-fresh/10" : ans === i ? "border-overdue" : "border-night-line opacity-70") : "border-night-line hover:border-electric-soft"}`}>{f.name}</button>;
            })}
          </div>
          {done && <p className="mt-3 text-sm">{q.a.name} · population <span className="font-mono">{fmtFact(q.a, q.ind)}</span> <Year f={q.a} /></p>}
        </div>
      )}

      {q.kind === "quiz" && (
        <div className="mt-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o, i) => (
              <button key={o} disabled={done} onClick={() => lock(i)} className={`rounded-md border p-3 text-left font-medium transition ${done ? (i === q.answer ? "border-fresh bg-fresh/10" : ans === i ? "border-overdue" : "border-night-line opacity-70") : "border-night-line hover:border-electric-soft"}`}>{o}</button>
            ))}
          </div>
          {done && <p className="mt-3 text-sm">{q.explain}</p>}
        </div>
      )}

      {q.kind === "guess" && (
        <div className="mt-4">
          <p className="flex items-center gap-2 font-medium"><Flag f={q.a} />{q.a.name}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {q.choices.map((f, i) => {
              const right = f.iso3 === q.a.iso3;
              return <button key={f.iso3} disabled={done} onClick={() => lock(i)} className={`rounded-md border p-3 text-left font-mono text-lg transition ${done ? (right ? "border-fresh bg-fresh/10" : ans === i ? "border-overdue" : "border-night-line opacity-70") : "border-night-line hover:border-electric-soft"}`}>{fmtFact(f, q.ind)}{done && <span className="block font-sans text-xs text-night-muted">{f.name}{f.year ? ` · ${f.year}` : ""}</span>}</button>;
            })}
          </div>
        </div>
      )}

      {q.kind === "rank" && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {q.items.map((f, i) => {
            const right = f.iso3 === rankAnswer(q);
            return (
              <button key={f.iso3} disabled={done} onClick={() => lock(i)} className={`flex items-center gap-3 rounded-md border p-3 text-left transition ${done ? (right ? "border-fresh bg-fresh/10" : ans === i ? "border-overdue" : "border-night-line opacity-70") : "border-night-line hover:border-electric-soft"}`}>
                <Flag f={f} /><span className="flex-1"><span className="block font-medium">{f.name}</span>{done && <span className="font-mono text-sm">{fmtFact(f, q.ind)} <Year f={f} /></span>}</span>
              </button>
            );
          })}
        </div>
      )}

      {done && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-night-line pt-4">
          <p className="flex items-center gap-2 font-semibold">{points >= 50 ? <Check className="text-fresh" /> : <X className="text-overdue" />}{points} points</p>
          <p className="text-xs text-night-muted">Source: {q.src ? <><a href={q.src.url} target="_blank" rel="noreferrer" className="underline">{q.src.name}</a>{q.src.period ? ` · ${q.src.period}` : ""}</> : <a href={`https://data.worldbank.org/indicator/${q.ind.id}`} target="_blank" rel="noreferrer" className="underline">{WORLD_SOURCE.name}</a>}</p>
          <Button onClick={() => onDone(ans, points)}>Next</Button>
        </div>
      )}
    </div>
  );
}
