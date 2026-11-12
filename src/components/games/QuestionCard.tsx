import { useState } from "react";
import { ArrowDown, ArrowUp, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtFact, questionText, rankOrder, scoreQuestion, type Answer, type Fact, type Question } from "@/lib/games";
import { WORLD_SOURCE } from "@/lib/world";

const Flag = ({ f }: { f: Fact }) => f.iso2 ? <img src={`https://flagcdn.com/w80/${f.iso2.toLowerCase()}.png`} alt="" width={40} height={27} loading="lazy" className="h-[27px] w-10 rounded-sm object-cover ring-1 ring-night-line" /> : null;
const Year = ({ f }: { f: Fact }) => <span className="font-mono text-[11px] text-night-muted">{f.year}</span>;

/** One question: player answers, then sees the real figure, its year and the source. */
export function QuestionCard({ q, onDone }: { q: Question; onDone: (ans: Answer, points: number) => void }) {
  const [ans, setAns] = useState<Answer>(null);
  const [guess, setGuess] = useState("");
  const [order, setOrder] = useState<Fact[]>(q.kind === "rank" ? q.items : []);
  const done = ans !== null;
  const points = done ? scoreQuestion(q, ans) : 0;
  const lock = (a: Answer) => { if (!done) setAns(a); };
  const move = (i: number, d: number) => setOrder((o) => { const n = [...o]; const j = i + d; if (j < 0 || j >= n.length) return o; [n[i], n[j]] = [n[j]!, n[i]!]; return n; });

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

      {q.kind === "guess" && (
        <form className="mt-4 flex flex-wrap items-center gap-3" onSubmit={(e) => { e.preventDefault(); const n = Number(guess.replace(/[,\s]/g, "")); if (Number.isFinite(n)) lock(n); }}>
          <Flag f={q.a} />
          <input inputMode="decimal" value={guess} disabled={done} onChange={(e) => setGuess(e.target.value)} placeholder={q.ind.unit === "people" ? "e.g. 25000000" : "e.g. 75"} className="w-48 rounded-md border border-night-line bg-night px-3 py-2 font-mono" aria-label="Your guess" />
          {!done && <Button type="submit" disabled={!guess.trim()}>Lock in</Button>}
          {done && <p className="w-full text-sm">Real figure: <span className="font-mono text-lg">{fmtFact(q.a, q.ind)}</span> <Year f={q.a} /> · you said {Number(ans).toLocaleString("en-GB")}</p>}
        </form>
      )}

      {q.kind === "rank" && (
        <div className="mt-4 space-y-2">
          {order.map((f, i) => {
            const right = done && rankOrder(q.items)[i] === f.iso3;
            return (
              <div key={f.iso3} className={`flex items-center gap-3 rounded-md border p-2 ${done ? (right ? "border-fresh" : "border-overdue") : "border-night-line"}`}>
                <span className="w-5 font-mono text-night-muted">{i + 1}</span><Flag f={f} /><span className="flex-1">{f.name}</span>
                {done ? <span className="font-mono text-sm">{fmtFact(f, q.ind)} <Year f={f} /></span> : (
                  <span className="flex gap-1"><Button size="icon" variant="outline" aria-label={`Move ${f.name} up`} onClick={() => move(i, -1)}><ArrowUp /></Button><Button size="icon" variant="outline" aria-label={`Move ${f.name} down`} onClick={() => move(i, 1)}><ArrowDown /></Button></span>
                )}
              </div>
            );
          })}
          {!done && <Button onClick={() => lock(order.map((f) => f.iso3))}>Lock in order</Button>}
        </div>
      )}

      {done && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-night-line pt-4">
          <p className="flex items-center gap-2 font-semibold">{points >= 50 ? <Check className="text-fresh" /> : <X className="text-overdue" />}{points} points</p>
          <p className="text-xs text-night-muted">Source: <a href={`https://data.worldbank.org/indicator/${q.ind.id}`} target="_blank" rel="noreferrer" className="underline">{WORLD_SOURCE.name}</a></p>
          <Button onClick={() => onDone(ans, points)}>Next</Button>
        </div>
      )}
    </div>
  );
}
