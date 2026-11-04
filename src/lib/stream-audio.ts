/**
 * Broadcast sound bed for /globe/broadcast, synthesised in the browser with Web Audio.
 * Generated here (no recordings), so there is no third-party copyright to clear.
 * Browsers keep it silent until autoplay is allowed (the streaming Chromium is started with
 * --autoplay-policy=no-user-gesture-required).
 */
export type StreamAudio = { sting: () => void; stop: () => void };

export function startStreamAudio(volume = 0.18): StreamAudio | null {
  const AC = typeof window !== "undefined" ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined;
  if (!AC) return null;
  const ctx = new AC();
  const master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);

  // Soft low drone: two detuned sines through a slowly breathing low-pass filter.
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 420;
  filter.connect(master);
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.05;
  lfoGain.gain.value = 180;
  lfo.connect(lfoGain).connect(filter.frequency);
  const voices = [110, 110.6, 164.8].map((f, i) => {
    const o = ctx.createOscillator();
    o.type = i === 2 ? "triangle" : "sine";
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = i === 2 ? 0.08 : 0.22;
    o.connect(g).connect(filter);
    o.start();
    return o;
  });
  lfo.start();

  // Gentle radar pulse every 4 seconds.
  const pulse = () => tone(880, 0.05, 0.6);
  const timer = window.setInterval(pulse, 4000);

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
    stop: () => { window.clearInterval(timer); voices.forEach((v) => v.stop()); lfo.stop(); void ctx.close(); },
  };
}
