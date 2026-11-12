/** Retro chiptune arrangement of "Rule, Britannia!" (Thomas Arne, 1740, public domain), synthesised with Web Audio — no samples.
const N = (s: string) => { const m = /^([A-G])(#?)(\d)$/.exec(s)!; const i = "C D EF G A B".indexOf(m[1]!) + (m[2] ? 1 : 0); return 440 * 2 ** ((i - 9) / 12 + (Number(m[3]) - 4)); };
const LEAD = "D5 . . . C5 B4 C5 D5 . G4 . . A4 B4 C5 . B4 . A4 G4 . . . . D5 D5 E5 D5 C5 B4 C5 B4 A4 G4 A4 B4 C5 A4 G4 . F#4 . G4 . . . . . . .".split(" ");
const BASS = "G2 G3 G2 G3 G2 G3 G2 G3 C2 C3 G2 G3 G2 G3 G2 G3 D2 D3 D2 D3 C2 C3 G2 G3 G2 G3 G2 G3 D2 D3 G2 G3 D2 D3 D2 D3 C2 C3 G2 G3 D2 D3 C2 C3 D2 D3 G2 G3 G2 G3".split(" ");
const STEP = 0.2;

export interface Music { start(): void; stop(): void; dispose(): void }

export function createMusic(): Music {
  let ctx: AudioContext | null = null, gain: GainNode | null = null, timer: ReturnType<typeof setInterval> | null = null, idx = 0, next = 0;
  const tone = (f: number, at: number, len: number, type: OscillatorType, vol: number) => {
    const o = ctx!.createOscillator(), g = ctx!.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.001, at + len);
    o.connect(g).connect(gain!); o.start(at); o.stop(at + len + 0.02);
  };
  const tick = () => {
    while (ctx && next < ctx.currentTime + 0.3) {
      const l = LEAD[idx % LEAD.length]!, b = BASS[idx % BASS.length]!;
      if (l !== ".") tone(N(l), next, STEP * 0.9, "square", 0.05);
      tone(N(b), next, STEP * 0.8, "triangle", 0.12);
      if (idx % 4 === 0) tone(90, next, 0.08, "sine", 0.15);
      idx++; next += STEP;
    }
  };
  return {
    start() {
      if (!ctx) { const AC = window.AudioContext ?? (window as any).webkitAudioContext; ctx = new AC(); gain = ctx.createGain(); gain.gain.value = 0.6; gain.connect(ctx.destination); }
      void ctx.resume(); if (timer) return;
      next = ctx.currentTime + 0.05; timer = setInterval(tick, 60);
    },
    stop() { if (timer) clearInterval(timer); timer = null; void ctx?.suspend(); },
    dispose() { this.stop(); void ctx?.close(); ctx = null; },
  };
}
