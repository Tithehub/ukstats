import { useEffect, useRef, useState } from "react";
import { newGame, step, stageAt, progress, score, W, H, GROUND, PLAYER_X, COL_W, STAGES, BOSS_HP, type State } from "@/lib/lowes-mission";
import boss from "@/assets/games/dash/burnham-boss.png";
import farage from "@/assets/games/dash/farage.png";
import hero from "@/assets/games/dash/lowe.png";
import badenoch from "@/assets/games/dash/badenoch.png";
import bgLondon from "@/assets/games/dash/bg-london.jpg";
import bgMid from "@/assets/games/dash/bg-midlands.jpg";
import bgMan from "@/assets/games/dash/bg-manchester.jpg";

const BEST_KEY = "lowes-mission-best";
function load(src: string) { const i = new Image(); i.src = src; return i; }

export function LowesMission() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"ready" | "play" | "over">("ready");
  const [result, setResult] = useState<State | null>(null);
  const [best, setBest] = useState(0);
  const flapRef = useRef(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => { setBest(Number(localStorage.getItem(BEST_KEY) ?? 0) || 0); }, []);

  useEffect(() => {
    const imgs = { boss: load(boss), farage: load(farage), hero: load(hero), badenoch: load(badenoch), bg: [load(bgLondon), load(bgMid), load(bgMan)] };
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
      for (const c of s.voteList) if (!c.taken) {
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(Math.sin(t * 3 + c.x / 40) * 0.25);
        ctx.fillStyle = "#fff"; ctx.fillRect(-14, -10, 28, 20); ctx.strokeStyle = "#051D3F"; ctx.lineWidth = 2; ctx.strokeRect(-14, -10, 28, 20);
        ctx.fillStyle = "#051D3F"; ctx.font = "bold 8px Archivo, sans-serif"; ctx.textAlign = "center"; ctx.fillText("VOTE", 0, -1);
        ctx.strokeStyle = "#c8102e"; ctx.beginPath(); ctx.moveTo(-5, 3); ctx.lineTo(-1, 7); ctx.lineTo(6, 0); ctx.stroke(); ctx.restore();
      }
      for (const f of s.flyers) {
        const im = imgs[f.who]; if (!im.complete) continue;
        ctx.save(); ctx.translate(f.x, f.y); if (f.smashed) { ctx.rotate(f.smashed * 12); ctx.globalAlpha = Math.max(0, 1 - f.smashed); }
        ctx.drawImage(im, -34, -34, 68, 68); ctx.restore();
        if (f.smashed && f.smashed < 0.6) { ctx.save(); ctx.fillStyle = "#f5c518"; ctx.strokeStyle = "#c8102e"; ctx.lineWidth = 3; ctx.font = "900 26px Archivo, sans-serif"; ctx.textAlign = "center"; ctx.strokeText("SMASH!", f.x, f.y - 30); ctx.fillText("SMASH!", f.x, f.y - 30); ctx.restore(); }
      }
      for (const p of s.tapes) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(t * 8); ctx.fillStyle = "#c8102e"; ctx.fillRect(-12, -6, 24, 12); ctx.fillStyle = "#efe9dc"; ctx.fillRect(-12, -2, 24, 4); ctx.restore(); }
      if (s.boss) {
        const b = s.boss, bw = 110, bh = 140;
        ctx.save(); if (b.invuln > 0 && Math.floor(t * 20) % 2) ctx.globalAlpha = 0.4;
        if (imgs.boss.complete) ctx.drawImage(imgs.boss, b.x - bw / 2, b.y - bh / 2 + b.enter * -300, bw, bh); ctx.restore();
        ctx.fillStyle = "rgba(5,29,63,0.85)"; ctx.fillRect(W / 2 - 160, 42, 320, 26);
        ctx.fillStyle = "#fff"; ctx.font = "bold 12px Archivo, sans-serif"; ctx.textAlign = "center"; ctx.fillText("BOSS · PRIME MINISTER ANDY BURNHAM", W / 2, 54);
        ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fillRect(W / 2 - 150, 58, 300, 6);
        ctx.fillStyle = "#c8102e"; ctx.fillRect(W / 2 - 150, 58, 300 * (b.hp / BOSS_HP), 6);
      }
      // player
      ctx.save(); ctx.translate(PLAYER_X, s.y); ctx.rotate(Math.max(-0.4, Math.min(0.6, s.vy / 900)));
      ctx.scale(-1, 1); if (imgs.hero.complete) ctx.drawImage(imgs.hero, -36, -36, 72, 72); ctx.restore();
      // HUD
      ctx.fillStyle = "rgba(5,29,63,0.85)"; ctx.fillRect(0, 0, W, 34);
      ctx.fillStyle = "#fff"; ctx.font = "bold 14px Archivo, sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`🗳 ${s.votes}  💥 ${s.smashed}  Score ${score(s)}`, 12, 22);
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
    const text = `I scored ${score(result)} in Lowe's Mission on UKStats — ${result.won ? "made it to Manchester!" : `reached ${stageAt(result.dist).name}`}. https://ukstats.co.uk/games/lowes-mission`;
    try { if (navigator.share) await navigator.share({ text }); else await navigator.clipboard.writeText(text); } catch { /* cancelled */ }
  };

  return (
    <div className="relative mt-4 select-none overflow-hidden rounded-lg border border-night-line">
      <canvas ref={canvas} width={W} height={H} onPointerDown={(e) => { e.preventDefault(); flap(); }} className="block aspect-[16/9] w-full touch-none bg-night" aria-label="Lowe's Mission game area. Press space or tap to fly." />
      {phase !== "play" && (
        <div className="absolute inset-0 flex items-center justify-center bg-night/70 p-4 text-center">
          <div className="max-w-sm rounded-lg bg-night-panel p-5">
            {phase === "ready" ? (
              <>
                <h2 className="text-2xl font-semibold">London → Manchester</h2>
                <p className="mt-2 text-sm text-night-muted">Tap, click or press space to fly. Collect votes, smash rival MPs, dodge scandals and riot barricades — and ram Prime Minister Burnham three times when he lunges at you.</p>
                <button onClick={flap} className="mt-4 rounded-md bg-primary px-5 py-2 font-medium text-primary-foreground">Start</button>
              </>
            ) : result && (
              <>
                <h2 className="text-2xl font-semibold">{result.won ? "Mission complete!" : "Mission failed"}</h2>
                <p className="mt-1 text-sm text-night-muted">{result.cause}</p>
                <p className="mt-3 text-3xl font-semibold">{score(result)}</p>
                <p className="text-sm text-night-muted">{result.votes} votes · {result.smashed} MPs smashed · {result.bossesBeaten} boss wins · {Math.round(progress(result.dist) * 100)}% of the way · Best {best}</p>
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
