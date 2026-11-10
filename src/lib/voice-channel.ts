/** One presenter voice at a time across the whole page: claiming the channel stops whatever was playing. */
let active: { token: number; stop: () => void } | null = null;
let next = 0;
export function claimVoice(stop: () => void): number {
  const prev = active; active = null;
  try { prev?.stop(); } catch { /* ignore */ }
  active = { token: ++next, stop };
  return active.token;
}
export function releaseVoice(token: number): void { if (active?.token === token) active = null; }
export function voiceActive(): boolean { return active !== null; }

/* ---------- One page-wide audio player ----------
 * Every presenter line plays through this single element, so two clips can never sound at once:
 * starting a line swaps the source of the same element, and a clip whose turn has passed is dropped. */
export interface VoiceEl { src: string; onended: (() => void) | null; onerror: (() => void) | null; pause(): void; play(): Promise<void>; removeAttribute?(n: string): void; load?(): void }
let player: VoiceEl | null = null;
let ctx: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let turn = 0;
let overlaps = 0;
let make: () => VoiceEl = () => {
  const a = new Audio(); a.preload = "auto";
  try { ctx = new AudioContext(); const s = ctx.createMediaElementSource(a); analyserNode = ctx.createAnalyser(); analyserNode.fftSize = 512; s.connect(analyserNode); analyserNode.connect(ctx.destination); } catch { analyserNode = null; }
  return a;
};
/** Test hook: swap the element factory. */
export function _setVoiceFactory(f: () => VoiceEl): void { make = f; player = null; turn = 0; overlaps = 0; active = null; }
export const voiceAnalyser = (): AnalyserNode | null => analyserNode;
export const voiceOverlapsBlocked = (): number => overlaps;
/** Reserve the next turn; any earlier turn (playing or still loading) is cancelled immediately. */
export function nextTurn(): number { stopVoice(); return ++turn; }
export const isTurn = (t: number): boolean => t === turn;
/** Stop whatever is playing on the one player. */
export function stopVoice(): void {
  const p = player; if (!p) return;
  p.onended = null; p.onerror = null; try { p.pause(); } catch { /* ignore */ }
  const prev = active; active = null; try { prev?.stop(); } catch { /* ignore */ }
}
/** Play a clip for turn `t`. Resolves false (and plays nothing) if the turn has passed. */
export async function playVoice(t: number, src: string, onDone: () => void): Promise<boolean> {
  if (t !== turn) { overlaps++; return false; }
  player ??= make();
  const p = player;
  stopVoice();
  if (ctx?.state === "suspended") { try { await ctx.resume(); } catch { /* ignore */ } }
  if (t !== turn) { overlaps++; return false; }
  let done = false;
  const end = () => { if (done || t !== turn) return; done = true; p.onended = null; p.onerror = null; active = null; onDone(); };
  p.onended = end; p.onerror = end; p.src = src;
  active = { token: ++next, stop: () => { done = true; } };
  try { await p.play(); } catch { if (t === turn) { p.onended = null; p.onerror = null; active = null; } return false; }
  if (t !== turn) { try { p.pause(); } catch { /* ignore */ } overlaps++; return false; }
  return true;
}
if (typeof window !== "undefined") {
  const halt = () => { turn++; stopVoice(); };
  window.addEventListener("pagehide", halt);
}
