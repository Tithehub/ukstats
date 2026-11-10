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
