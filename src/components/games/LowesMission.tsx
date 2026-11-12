import { useEffect, useRef, useState } from "react";
import { newGame, step, stageAt, progress, score, W, H, GROUND, PLAYER_X, COL_W, STAGES, LEVELS, DIFFICULTIES, PUNCH_COOLDOWN, type State, type Difficulty } from "@/lib/lowes-mission";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { submitArcadeScore } from "@/lib/arcade.functions";
import { ArcadeLeaderboard } from "./ArcadeLeaderboard";
import { SHARE_TARGETS, absoluteUrl } from "@/lib/share";
import rbLogo from "@/assets/games/dash/restore-britain-logo.png.asset.json";
import boss from "@/assets/games/dash/burnham-boss.png";
import polanski from "@/assets/games/dash/polanski.png";
import mastermind from "@/assets/games/dash/mastermind.png";
import hero from "@/assets/games/dash/lowe-hero.png";
import bossRun from "@/assets/games/dash/burnham-run.png";
import mahmood from "@/assets/games/dash/mahmood.png";
import rayner from "@/assets/games/dash/rayner.png";
import khan from "@/assets/games/dash/khan.png";
import badenoch from "@/assets/games/dash/badenoch.png";
import bgLondon from "@/assets/games/dash/bg-london.jpg";
import bgMid from "@/assets/games/dash/bg-midlands.jpg";
import bgMan from "@/assets/games/dash/bg-manchester.jpg";

const bestKey = (d: Difficulty) => (d === "normal" ? "lowes-mission-best" : `lowes-mission-best-${d}`);
const DOUBLE_TAP_MS = 280;
function drawPoppy(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2 + x / 50) * 0.2);
  ctx.fillStyle = "#4d6b2e"; ctx.beginPath(); ctx.ellipse(10, -10, 5, 11, 0.8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#d4111a";
  for (const [px, py] of [[-6, -5], [6, -5], [-5, 6], [5, 6]] as const) { ctx.beginPath(); ctx.arc(px, py, 8.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function load(src: string) { const i = new Image(); i.src = src; return i; }

export function LowesMission() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<"ready" | "play" | "over">("ready");
  const [result, setResult] = useState<State | null>(null);
  const [best, setBest] = useState(0);
  const [level, setLevel] = useState<Difficulty>("normal");
  const levelRef = useRef(level); levelRef.current = level;
  const [signedIn, setSignedIn] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [boardTick, setBoardTick] = useState(0);
  const save = useServerFn(submitArcadeScore);
  const saveRef = useRef(save); saveRef.current = save;
  const signedRef = useRef(false); signedRef.current = signedIn;
  const flapRef = useRef(false);
  const punchRef = useRef(false);
  const lastTap = useRef(0);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const box = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  const [native, setNative] = useState(false);
  useEffect(() => {
    const on = () => {
      const el = document.fullscreenElement ?? (document as any).webkitFullscreenElement;
      setNative(!!el); if (!el) setFull((f) => (f && native ? false : f));
    };
    document.addEventListener("fullscreenchange", on); document.addEventListener("webkitfullscreenchange", on);
    return () => { document.removeEventListener("fullscreenchange", on); document.removeEventListener("webkitfullscreenchange", on); };
  }, [native]);
  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setFull(false); };
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", esc); };
  }, [full]);
  const toggleFull = async () => {
    const d = document as any;
    if (full) {
      setFull(false);
      if (d.fullscreenElement || d.webkitFullscreenElement) await (d.exitFullscreen ?? d.webkitExitFullscreen)?.call(d).catch?.(() => {});
      return;
    }
    setFull(true);
    const el = box.current as any;
    const req = el?.requestFullscreen ?? el?.webkitRequestFullscreen;
    try { if (req) { await req.call(el); await (screen.orientation as any)?.lock?.("landscape").catch(() => {}); } } catch { /* CSS fallback stays on */ }
  };

  useEffect(() => { setBest(Number(localStorage.getItem(bestKey(level)) ?? 0) || 0); }, [level]);
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session)); }, []);

  useEffect(() => {
    const imgs = { boss: load(boss), polanski: load(polanski), mastermind: load(mastermind), hero: load(hero), badenoch: load(badenoch), mahmood: load(mahmood), rayner: load(rayner), khan: load(khan), bossRun: load(bossRun), logo: load(rbLogo.url), bg: [load(bgLondon), load(bgMid), load(bgMan)] };
    const ctx = canvas.current!.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let s = newGame(Date.now() % 100000, levelRef.current);
    let runT = 0;
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
        ctx.fillStyle = "#cfd6e0"; ctx.fillRect(bx, GROUND - 240, 4, 240);
        const wave = Math.sin(t * 3 + i) * 4;
        // white flag with the Restore Britain mark
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(bx + 4, GROUND - 238);
        ctx.quadraticCurveTo(bx + 60, GROUND - 246 + wave, bx + 124, GROUND - 238 + wave); ctx.lineTo(bx + 124, GROUND - 176 + wave);
        ctx.quadraticCurveTo(bx + 60, GROUND - 184 + wave, bx + 4, GROUND - 176); ctx.closePath(); ctx.fill();
        if (imgs.logo.complete && imgs.logo.naturalWidth) ctx.drawImage(imgs.logo, bx + 10, GROUND - 232 + wave * 0.6, 108, 56);
        // hanging banner
        const hx = bx + 200;
        ctx.strokeStyle = "#cfd6e0"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx - 6, GROUND - 160); ctx.lineTo(hx + 186, GROUND - 160); ctx.stroke(); ctx.lineWidth = 1;
        ctx.fillStyle = "#fff"; ctx.fillRect(hx, GROUND - 160, 180, 34);
        ctx.fillStyle = "#081F40"; ctx.fillRect(hx + 3, GROUND - 157, 174, 28);
        ctx.fillStyle = "#c8102e"; ctx.fillRect(hx + 3, GROUND - 133, 174, 4);
        ctx.fillStyle = "#fff"; ctx.font = "900 13px Georgia, 'Times New Roman', serif"; ctx.textAlign = "center";
        ctx.fillText("AIM HIGH, VOTE LOWE", hx + 90, GROUND - 138);
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
      for (const c of s.voteList) if (!c.taken && c.poppy) drawPoppy(ctx, c.x, c.y, t);
      for (const c of s.voteList) if (!c.taken && !c.poppy) {
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
        { const ri = r.mastermind ? imgs.mastermind : imgs.bossRun; if (ri.complete) ctx.drawImage(ri, -45, -70, 70, 140); } ctx.restore();
        if (r.t < 1.5) { ctx.save(); ctx.fillStyle = "#f5c518"; ctx.strokeStyle = "#051D3F"; ctx.lineWidth = 4; ctx.font = "900 34px Archivo, sans-serif"; ctx.textAlign = "center"; { const msg = r.mastermind ? "MASTERMIND DEFEATED!" : "BIRDMAN DEFEATED!"; ctx.strokeText(msg, W / 2, H / 2 - 60); ctx.fillText(msg, W / 2, H / 2 - 60); } ctx.restore(); }
      }
      for (const p of s.tapes) { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(t * 8); ctx.fillStyle = "#c8102e"; ctx.fillRect(-12, -6, 24, 12); ctx.fillStyle = "#efe9dc"; ctx.fillRect(-12, -2, 24, 4); ctx.restore(); }
      if (s.boss) {
        const b = s.boss, bw = 110, bh = 140;
        ctx.save(); if (b.invuln > 0 && Math.floor(t * 20) % 2) ctx.globalAlpha = 0.4;
        if (b.flee > 0) {
          const bob = Math.abs(Math.sin(t * 18)) * 8;
          ctx.translate(b.x, b.y - bob); ctx.scale(-1, 1);
          const ri = b.mastermind ? imgs.mastermind : imgs.bossRun; if (ri.complete) ctx.drawImage(ri, -45, -70, b.mastermind ? 70 : 90, 140);
        } else { const bi = b.mastermind ? imgs.mastermind : imgs.boss; if (bi.complete) ctx.drawImage(bi, b.x - (b.mastermind ? 35 : bw / 2), b.y - bh / 2 + b.enter * -300, b.mastermind ? 70 : bw, bh); }
        ctx.restore();
        ctx.fillStyle = "rgba(5,29,63,0.85)"; ctx.fillRect(W / 2 - 160, 42, 320, 26);
        ctx.fillStyle = "#fff"; ctx.font = "bold 12px Archivo, sans-serif"; ctx.textAlign = "center"; ctx.fillText(b.mastermind ? "FINAL BOSS · MASTERMIND" : "BOSS · PRIME MINISTER ANDY BIRDMAN", W / 2, 54);
        ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fillRect(W / 2 - 150, 58, 300, 6);
        ctx.fillStyle = "#c8102e"; ctx.fillRect(W / 2 - 150, 58, 300 * (b.hp / LEVELS[s.difficulty].bossHp), 6);
      }
      // player
      ctx.save(); ctx.translate(PLAYER_X, s.y); ctx.rotate(Math.max(-0.4, Math.min(0.6, s.vy / 900)));
      const lunge = s.punch > 0 ? 26 : 0;
      if (imgs.hero.complete) ctx.drawImage(imgs.hero, -40 + lunge, -40, 80, 80); ctx.restore();
      if (s.punch > 0) { ctx.save(); ctx.fillStyle = "#f5c518"; ctx.strokeStyle = "#c8102e"; ctx.lineWidth = 3; ctx.font = "900 24px Archivo, sans-serif"; ctx.textAlign = "center"; ctx.strokeText("POW!", PLAYER_X + 70, s.y - 26); ctx.fillText("POW!", PLAYER_X + 70, s.y - 26); ctx.restore(); }
      // HUD
      ctx.fillStyle = "rgba(5,29,63,0.85)"; ctx.fillRect(0, 0, W, 34);
      ctx.fillStyle = "#fff"; ctx.font = "bold 14px Archivo, sans-serif"; ctx.textAlign = "left";
      ctx.fillText(`🗳 ${s.votes}  🌺 ${s.poppies}  💥 ${s.smashed}  Score ${score(s)}`, 12, 22);
      // power punch meter
      const ready = 1 - s.punchCd / PUNCH_COOLDOWN;
      ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fillRect(12, 40, 80, 6);
      ctx.fillStyle = ready >= 1 ? "#f5c518" : "#9aa7b8"; ctx.fillRect(12, 40, 80 * ready, 6);
      ctx.fillStyle = "#fff"; ctx.font = "bold 10px Archivo, sans-serif"; ctx.fillText(ready >= 1 ? "👊 PUNCH READY" : "👊 charging", 12, 58);
      ctx.textAlign = "right"; ctx.fillText(st.name, W - 12, 22);
      const p = progress(s.dist), bx = 260, bw = 330;
      ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fillRect(bx, 14, bw, 8);
      ctx.fillStyle = "#c8102e"; ctx.fillRect(bx, 14, bw * p, 8);
      ctx.fillStyle = "#fff"; for (const sg of STAGES) ctx.fillRect(bx + bw * sg.at, 11, 2, 14);
    };

    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now; t += dt;
      if (phaseRef.current === "play") {
        runT += dt;
        s = step(s, dt, flapRef.current, punchRef.current); flapRef.current = false; punchRef.current = false;
        if (s.over) {
          const sc = score(s), key = bestKey(s.difficulty);
          const prev = Number(localStorage.getItem(key) ?? 0) || 0;
          if (sc > prev) { localStorage.setItem(key, String(sc)); setBest(sc); }
          setSaveMsg("");
          if (signedRef.current && sc > 0) saveRef.current({ data: { difficulty: s.difficulty, score: sc, seconds: Math.ceil(runT) } })
            .then((r) => { setSaveMsg(r.ok ? "Score saved to the leaderboard." : r.error); if (r.ok) setBoardTick((n) => n + 1); })
            .catch(() => setSaveMsg("Couldn't save your score."));
          runT = 0;
          setResult(s); setPhase("over");
        }
      } else if (phaseRef.current === "ready" && s.dist > 0) s = newGame(Date.now() % 100000, levelRef.current);
      else if (phaseRef.current === "ready" && s.difficulty !== levelRef.current) s = newGame(Date.now() % 100000, levelRef.current);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const onVis = () => { last = performance.now(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const flap = () => {
    const now = performance.now();
    if (phaseRef.current === "play") {
      flapRef.current = true;
      if (now - lastTap.current < DOUBLE_TAP_MS) { punchRef.current = true; lastTap.current = 0; } else lastTap.current = now;
    }
    else if (phaseRef.current === "ready") { setPhase("play"); flapRef.current = true; }
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); flap(); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, []);

  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const shareText = result
    ? `I scored ${score(result)} in Aim High, Vote Lowe on UKStats — ${result.won ? "made it to Manchester!" : `reached ${stageAt(result.dist).name}`}. Can you beat me?`
    : "";
  const shareUrl = absoluteUrl("/games/aim-high-vote-lowe");
  const copyScore = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <>
    <div ref={box} className={full ? "fixed inset-0 z-[100] flex select-none items-center justify-center overflow-hidden bg-night touch-none" : "relative mt-4 select-none overflow-hidden rounded-lg border border-night-line"}>
      <button type="button" onClick={toggleFull} aria-label={full ? "Exit full screen" : "Full screen"} className="absolute right-2 top-2 z-20 rounded-md border border-night-line bg-night-panel/80 px-2.5 py-1.5 text-xs font-medium backdrop-blur">
        {full ? "✕ Exit" : "⛶ Full screen"}
      </button>
      <canvas ref={canvas} width={W} height={H} onPointerDown={(e) => { e.preventDefault(); flap(); }} className={full ? "block aspect-[16/9] max-h-full max-w-full w-auto h-auto touch-none bg-night" : "block aspect-[16/9] w-full touch-none bg-night"} style={full ? { width: "min(100vw, calc(100dvh * 16 / 9))" } : undefined} aria-label="Aim High, Vote Lowe game area. Press space or tap to fly." />
      {phase !== "play" && (
        <div className="absolute inset-0 flex items-center justify-center bg-night/70 p-4 text-center">
          <div className="max-w-sm rounded-lg bg-night-panel p-5">
            {phase === "ready" ? (
              <>
                <h2 className="text-2xl font-semibold">London → Manchester</h2>
                <p className="mt-2 text-sm text-night-muted">Tap, click or press space to fly as RUPERT AIM HIGH VOTE LOWE. Collect votes, blast Kemi Had Enough, Banana Mahmood, Angela Raver, Sadiq Can't and Zack Boobanski off the screen, grab poppies for bonus points, dodge scandals and riot barricades, ram Prime Minister Andy Birdman to send him running, then take down the MASTERMIND behind it all. Double-tap for a power punch that smashes through a scandal.</p>
                <div className="mt-3 flex justify-center gap-2" role="group" aria-label="Difficulty">
                  {DIFFICULTIES.map((d) => <button key={d} onClick={() => setLevel(d)} aria-pressed={level === d} className={`rounded-md px-3 py-1 text-sm ${level === d ? "bg-primary text-primary-foreground" : "border border-night-line"}`}>{LEVELS[d].label}</button>)}
                </div>
                <button onClick={flap} className="mt-4 rounded-md bg-primary px-5 py-2 font-medium text-primary-foreground">Start</button>
              </>
            ) : result && (
              <>
                <h2 className="text-2xl font-semibold">{result.won ? "Mission complete!" : "Mission failed"}</h2>
                <p className="mt-1 text-sm text-night-muted">{result.cause}</p>
                <p className="mt-3 text-3xl font-semibold">{score(result)}</p>
                <p className="text-sm text-night-muted">{LEVELS[result.difficulty].label} · {result.votes} votes · {result.poppies} poppies · {result.smashed} MPs smashed · {result.bossesBeaten} boss wins · {Math.round(progress(result.dist) * 100)}% of the way · Best {best}</p>
                <p className="mt-2 text-xs text-night-muted">{signedIn ? saveMsg : <><a href="/auth" className="underline">Sign in</a> to save your score to the leaderboard.</>}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <button onClick={() => { setResult(null); setPhase("ready"); }} className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground">Play again</button>
                  <button onClick={copyScore} className="rounded-md border border-night-line px-4 py-2">{copied ? "Copied!" : "Copy score"}</button>
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-1.5" aria-label="Share your score">
                  {SHARE_TARGETS.map((t) => (
                    <a key={t.key} href={t.href(shareUrl, shareText)} target="_blank" rel="noreferrer noopener" title={`Share on ${t.label}`} aria-label={`Share on ${t.label}`} className="inline-flex items-center gap-1 rounded-md border border-night-line px-2 py-1 text-xs">
                      <t.icon className="size-3.5" aria-hidden="true" />
                      {t.label}
                    </a>
                  ))}
                </div>
                {copyError && <p role="alert" className="mt-2 break-all text-xs text-night-muted">Couldn't copy. Your score: {score(result)} — {shareUrl}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
    <div className="mt-6"><ArcadeLeaderboard refresh={boardTick} /></div>
    </>
  );
}
