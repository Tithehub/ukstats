import { useEffect, useRef, useState } from "react";
import { newGame, step, stageAt, progress, score, W, H, GROUND, PLAYER_X, COL_W, STAGES, type State } from "@/lib/burnhams-dash";
import burnham from "@/assets/games/dash/burnham.png";
import farage from "@/assets/games/dash/farage.png";
import lowe from "@/assets/games/dash/lowe.png";
import badenoch from "@/assets/games/dash/badenoch.png";
import bgLondon from "@/assets/games/dash/bg-london.jpg";
import bgMid from "@/assets/games/dash/bg-midlands.jpg";
import bgMan from "@/assets/games/dash/bg-manchester.jpg";

const BEST_KEY = "burnhams-dash-best";
function load(src: string) { const i = new Image(); i.src = src; return i; }

export function BurnhamsDash() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"ready" | "play" | "over">("ready");
  const [result, setResult] = useState<State | null>(null);
  const [best, setBest] = useState(0);
  const flapRef = useRef(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => { setBest(Number(localStorage.getItem(BEST_KEY) ?? 0) || 0); }, []);

  useEffect(() => {
    const imgs = { burnham: load(burnham), farage: load(farage), lowe: load(lowe), badenoch: load(badenoch), bg: [load(bgLondon), load(bgMid), load(bgMan)] };
    const ctx = canvas.current!.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let s = newGame(Date.now() % 100000);
    let last = performance.now(), raf = 0, t = 0;

    const draw = () => {
      const st = stageAt(s.dist);
      const bg = imgs.bg[st.bg]!;
      const off = (s.dist * (reduce ? 0.05 : 0.25)) % W;
      if (bg.complete && bg.naturalWidth) { ctx.drawImage(bg, -off, 0, W, H); ctx.drawImage(bg, W - off, 0, W, H); }
      else { ctx.fillStyle = "#051D3F"; ctx.fillRect(0, 0, W, H); }
      ctx.fillStyle = "rgba(5,29,63,0.25)"; ctx.fillRect(0, 0, W, H);
      // ground
      ctx.fillStyle = "#3a3a3a"; ctx.fillRect(0, GROUND, W, H - GROUND);
      ctx.fillStyle = "#f5c518"; for (let x = -(s.dist % 60); x < W; x += 60) ctx.fillRect(x, GROUND + 18, 30, 4);
      // scandal columns
      for (const c of s.columns) {
        for (const [y, h] of [[0, c.gapY], [c.gapY + c.gap, GROUND - c.gapY - c.gap]] as const) {
          ctx.fillStyle = "#efe9dc"; ctx.fillRect(c.x, y, COL_W, h);
          ctx.strokeStyle = "#999"; for (let ly = y + 8; ly < y + h; ly += 10) { ctx.beginPath(); ctx.moveTo(c.x + 4, ly); ctx.lineTo(c.x + COL_W - 4, ly); ctx.stroke(); }
          ctx.fillStyle = "#c8102e"; ctx.fillRect(c.x - 4, y + h / 2 - 6, COL_W + 8, 12);
        }
        ctx.save(); ctx.fillStyle = "#111"; ctx.font = "bold 11px Archivo, sans-serif"; ctx.textAlign = "center";
        ctx.fillRect(c.x - 6, c.gapY - 22, COL_W + 12, 18); ctx.fillStyle = "#fff"; ctx.fillText(c.headline, c.x + COL_W / 2, c.gapY - 9); ctx.restore();
      }
      // riots: cones + tape
      for (const r of s.riots) {
        ctx.fillStyle = "#ff6b00";
        for (const cx of [r.x + 8, r.x + 52]) { ctx.beginPath(); ctx.moveTo(cx - 10, GROUND); ctx.lineTo(cx, GROUND - r.h); ctx.lineTo(cx + 10, GROUND); ctx.fill(); }
        ctx.fillStyle = "#f5c518"; ctx.fillRect(r.x, GROUND - r.h * 0.6, 60, 8);
        ctx.fillStyle = "#111"; for (let x = r.x; x < r.x + 60; x += 12) ctx.fillRect(x, GROUND - r.h * 0.6, 6, 8);
      }
      // coins
      for (const c of s.coinList) if (!c.taken) {
        const w = Math.abs(Math.cos(t * 4 + c.x / 50)) * 12 + 2;
        ctx.fillStyle = "#f5c518"; ctx.beginPath(); ctx.ellipse(c.x, c.y, w, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#a07800"; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
      }
      for (const f of s.flyers) { const im = imgs[f.who]; if (im.complete) ctx.drawImage(im, f.x - 34, f.y - 34, 68, 68); }
      // player
      ctx.save(); ctx.translate(PLAYER_X, s.y); ctx.rotate(Math.max(-0.4, Math.min(0.6, s.vy / 900)));
      if (imgs.burnham.complete) ctx.drawImage(imgs.burnham, -32, -32, 64, 64); ctx.restore();
      // HUD
      ctx.fillStyle = "rgba(5,29,63,0.85)"; ctx.fillRect(0, 0, W, 34);
      ctx.fillStyle = "#fff"; ctx.font = "bold 14px Archivo, sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`🪙 ${s.coins}   Score ${score(s)}`, 12, 22);
      ctx.textAlign = "right"; ctx.fillText(st.name, W - 12, 22);
      const p = progress(s.dist), bx = 260, bw = 330;
      ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fillRect(bx, 14, bw, 8);
      ctx.fillStyle = "#c8102e"; ctx.fillRect(bx, 14, bw * p, 8);
      ctx.fillStyle = "#fff"; for (const sg of STAGES) ctx.fillRect(bx + bw * sg.at, 11, 2, 14);
    };

    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now; t += dt;
      if (phaseRef.current === "play") {
        s = step(s, dt, flapRef.current); flapRef.current = false;
        if (s.over) {
          const sc = score(s);
          const prev = Number(localStorage.getItem(BEST_KEY) ?? 0) || 0;
          if (sc > prev) { localStorage.setItem(BEST_KEY, String(sc)); setBest(sc); }
          setResult(s); setPhase("over");
        }
      } else if (phaseRef.current === "ready" && s.dist > 0) s = newGame(Date.now() % 100000);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onVis = () => { last = performance.now(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const flap = () => {
    if (phaseRef.current === "play") flapRef.current = true;
    else if (phaseRef.current === "ready") { setPhase("play"); flapRef.current = true; }
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); flap(); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, []);

  const share = async () => {
    if (!result) return;
    const text = `I scored ${score(result)} in Burnham's Dash on UKStats — ${result.won ? "made it to Manchester!" : `reached ${stageAt(result.dist).name}`}. https://ukstats.co.uk/games/burnhams-dash`;
    try { if (navigator.share) await navigator.share({ text }); else await navigator.clipboard.writeText(text); } catch { /* cancelled */ }
  };

  return (
    <div className="relative mt-4 select-none overflow-hidden rounded-lg border border-night-line">
      <canvas ref={canvas} width={W} height={H} onPointerDown={(e) => { e.preventDefault(); flap(); }} className="block aspect-[16/9] w-full touch-none bg-night" aria-label="Burnham's Dash game area. Press space or tap to fly." />
      {phase !== "play" && (
        <div className="absolute inset-0 flex items-center justify-center bg-night/70 p-4 text-center">
          <div className="max-w-sm rounded-lg bg-night-panel p-5">
            {phase === "ready" ? (
              <>
                <h2 className="text-2xl font-semibold">London → Manchester</h2>
                <p className="mt-2 text-sm text-night-muted">Tap, click or press space to fly. Grab coins, dodge scandals, clear the riot barricades and steer clear of rival MPs.</p>
                <button onClick={flap} className="mt-4 rounded-md bg-primary px-5 py-2 font-medium text-primary-foreground">Start</button>
              </>
            ) : result && (
              <>
                <h2 className="text-2xl font-semibold">{result.won ? "Welcome to Manchester!" : "Run over"}</h2>
                <p className="mt-1 text-sm text-night-muted">{result.cause}</p>
                <p className="mt-3 text-3xl font-semibold">{score(result)}</p>
                <p className="text-sm text-night-muted">{result.coins} coins · {Math.round(progress(result.dist) * 100)}% of the way · Best {best}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button onClick={() => { setResult(null); setPhase("ready"); }} className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground">Play again</button>
                  <button onClick={share} className="rounded-md border border-night-line px-4 py-2">Share</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
