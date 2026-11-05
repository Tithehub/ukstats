/**
 * Optional broadcast chime for /globe/broadcast (only with ?sound=on), synthesised with Web Audio.
 * No continuous drone or pulse: the stream is silent by default.
 */
export type StreamAudio = { sting: () => void; stop: () => void };

export function startStreamAudio(volume = 0.18): StreamAudio | null {
  const AC = typeof window !== "undefined" ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined;
  if (!AC) return null;
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);

  function tone(freq: number, gain: number, dur: number, at = ctx.currentTime) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(master);
    o.start(at);
    o.stop(at + dur + 0.05);
  }

  const resume = () => { if (ctx.state === "suspended") void ctx.resume(); };
  resume();
  window.addEventListener("pointerdown", resume, { once: true });

  return {
    /** Two-note news chime when a segment changes. */
    sting: () => { resume(); const t = ctx.currentTime; tone(659.3, 0.35, 0.9, t); tone(987.8, 0.3, 1.2, t + 0.18); },
    stop: () => { void ctx.close(); },
  };
}
