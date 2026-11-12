import { useEffect, useRef, useState } from "react";
import { newGame, step, stageAt, progress, score, W, H, GROUND, PLAYER_X, COL_W, STAGES, BOSS_HP, type State } from "@/lib/lowes-mission";
import boss from "@/assets/games/dash/burnham-boss.png";
import farage from "@/assets/games/dash/farage.png";
import hero from "@/assets/games/dash/lowe-hero.png";
import bossRun from "@/assets/games/dash/burnham-run.png";
import mahmood from "@/assets/games/dash/mahmood.png";
import rayner from "@/assets/games/dash/rayner.png";
import khan from "@/assets/games/dash/khan.png";
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
    const imgs = { boss: load(boss), farage: load(farage), hero: load(hero), badenoch: load(badenoch), mahmood: load(mahmood), rayner: load(rayner), khan: load(khan), bossRun: load(bossRun), bg: [load(bgLondon), load(bgMid), load(bgMan)] };
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
      // Restore Britain flags and banners (slow parallax layer)
      const span = 420, boff = (s.dist * 0.5) % span;
      for (let i = -1; i < W / span + 1; i++) {
        const bx = i * span - boff + 60;
        ctx.fillStyle = "#cfd6e0"; ctx.fillRect(bx, GROUND - 230, 4, 230);
        const wave = Math.sin(t * 3 + i) * 4;
        ctx.fillStyle = "#051D3F"; ctx.beginPath(); ctx.moveTo(bx + 4, GROUND - 228);
        ctx.quadraticCurveTo(bx + 50, GROUND - 236 + wave, bx + 104, GROUND - 228 + wave); ctx.lineTo(bx + 104, GROUND - 178 + wave);
        ctx.quadraticCurveTo(bx + 50, GROUND - 186 + wave, bx + 4, GROUND - 178); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#c8102e"; ctx.fillRect(bx + 10, GROUND - 189 + wave * 0.6, 88, 3);
        ctx.fillStyle = "#fff"; ctx.font = "800 11px Archivo, sans-serif"; ctx.textAlign = "center";
        ctx.fillText("RESTORE", bx + 54, GROUND - 210 + wave * 0.6); ctx.fillText("BRITAIN", bx + 54, GROUND - 196 + wave * 0.6);
        // hanging banner between poles
        const hx = bx + 210;
        ctx.strokeStyle = "#cfd6e0"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx - 6, GROUND - 160); ctx.lineTo(hx + 136, GROUND - 160); ctx.stroke(); ctx.lineWidth = 1;
        ctx.fillStyle = "#fff"; ctx.fillRect(hx, GROUND - 160, 130, 30);
        ctx.fillStyle = "#051D3F"; ctx.fillRect(hx + 3, GROUND - 157, 124, 24);
        ctx.fillStyle = "#fff"; ctx.font = "800 12px Archivo, sans-serif"; ctx.fillText("RESTORE BRITAIN", hx + 65, GROUND - 141);
      }
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
        if (f.smashed) for (let k = 1; k <= 5; k++) { ctx.fillStyle = `rgba(220,220,220,${0.5 - k * 0.08})`; ctx.beginPath(); ctx.arc(f.x - k * 14, f.y + k * 20, 8 + k * 3, 0, Math.PI * 2); ctx.fill(); }
        ctx.save(); ctx.translate(f.x, f.y); if (f.smashed) { ctx.rotate(f.smashed * 12); ctx.globalAlpha = Math.max(0, 1 - f.smashed); }
        ctx.drawImage(im, -34, -34, 68, 68); ctx.restore();
        if (f.smashed && f.smashed < 0.6) { ctx.save(); ctx.fillStyle = "#f5c518"; ctx.strokeStyle = "#c8102e"; ctx.lineWidth = 3; ctx.font = "900 26px Archivo, sans-serif"; ctx.textAlign = "center"; ctx.strokeText("SMASH!", f.x, f.y - 30); ctx.fillText("SMASH!", f.x, f.y - 30); ctx.restore(); }
      }
      for (const r of s.runners) {
        ctx.save(); ctx.translate(r.x, r.y - Math.abs(Math.sin(r.t * 18)) * 8); ctx.scale(-1, 1);
        if (imgs.bossRun.complete) ctx.drawImage(imgs.bossRun, -45, -70, 90, 140); ctx.restore();
        if (r.t < 1.5) { ctx.save(); ctx.fillStyle = "#f5c518"; ctx.strokeStyle = "#051D3F"; ctx.lineWidth = 4; ctx.font = "900 34px Archivo, sans-serif"; ctx.textAlign = "center"; ctx.strokeText("BURNHAM DEFEATED!", W / 2, H / 2 - 60); ctx.fillText("BURNHAM DEFEATED!", W / 2, H / 2 - 60); ctx.restore(); }
      }
      for (const p of s.tapes) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(t * 8); ctx.fillStyle = "#c8102e"; ctx.fillRect(-12, -6, 24, 12); ctx.fillStyle = "#efe9dc"; ctx.fillRect(-12, -2, 24, 4); ctx.restore(); }
      if (s.boss) {
        const b = s.boss, bw = 110, bh = 140;
        ctx.save(); if (b.invuln > 0 && Math.floor(t * 20) % 2) ctx.globalAlpha = 0.4;
        if (b.flee > 0) {
          const bob = Math.abs(Math.sin(t * 18)) * 8;
          ctx.translate(b.x, b.y - bob); ctx.scale(-1, 1);
          if (imgs.bossRun.complete) ctx.drawImage(imgs.bossRun, -45, -70, 90, 140);
        } else if (imgs.boss.complete) ctx.drawImage(imgs.boss, b.x - bw / 2, b.y - bh / 2 + b.enter * -300, bw, bh);
        ctx.restore();
        ctx.fillStyle = "rgba(5,29,63,0.85)"; ctx.fillRect(W / 2 - 160, 42, 320, 26);
        ctx.fillStyle = "#fff"; ctx.font = "bold 12px Archivo, sans-serif"; ctx.textAlign = "center"; ctx.fillText("BOSS · PRIME MINISTER ANDY BURNHAM", W / 2, 54);
        ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fillRect(W / 2 - 150, 58, 300, 6);
        ctx.fillStyle = "#c8102e"; ctx.fillRect(W / 2 - 150, 58, 300 * (b.hp / BOSS_HP), 6);
      }
      // player
      ctx.save(); ctx.translate(PLAYER_X, s.y); ctx.rotate(Math.max(-0.4, Math.min(0.6, s.vy / 900)));
      if (imgs.hero.complete) ctx.drawImage(imgs.hero, -40, -40, 80, 80); ctx.restore();
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
    const text = `I scored ${score(result)} in Aim High, Vote Lowe on UKStats — ${result.won ? "made it to Manchester!" : `reached ${stageAt(result.dist).name}`}. https://ukstats.co.uk/games/aim-high-vote-lowe`;
    try { if (navigator.share) await navigator.share({ text }); else await navigator.clipboard.writeText(text); } catch { /* cancelled */ }
  };

  return (
    <div className="relative mt-4 select-none overflow-hidden rounded-lg border border-night-line">
      <canvas ref={canvas} width={W} height={H} onPointerDown={(e) => { e.preventDefault(); flap(); }} className="block aspect-[16/9] w-full touch-none bg-night" aria-label="Aim High, Vote Lowe game area. Press space or tap to fly." />
      {phase !== "play" && (
        <div className="absolute inset-0 flex items-center justify-center bg-night/70 p-4 text-center">
          <div className="max-w-sm rounded-lg bg-night-panel p-5">
            {phase === "ready" ? (
              <>
                <h2 className="text-2xl font-semibold">London → Manchester</h2>
                <p className="mt-2 text-sm text-night-muted">Tap, click or press space to fly. Collect votes, blast Farage, Badenoch, Mahmood, Rayner and Mayor Khan off the screen, dodge scandals and riot barricades — and ram Prime Minister Burnham three times when he lunges at you.</p>
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
