import { describe, it, expect } from "vitest";
import { claimVoice, releaseVoice, voiceActive } from "./voice-channel";
describe("voice channel", () => {
  it("starting a second clip stops the first", () => {
    let a = 0, b = 0;
    claimVoice(() => a++); const t2 = claimVoice(() => b++);
    expect(a).toBe(1); expect(b).toBe(0);
    releaseVoice(t2); expect(voiceActive()).toBe(false);
  });
  it("a stale release does not drop the current clip", () => {
    const t1 = claimVoice(() => {}); claimVoice(() => {});
    releaseVoice(t1); expect(voiceActive()).toBe(true);
  });
});

import { _setVoiceFactory, nextTurn, playVoice, voiceOverlapsBlocked } from "./voice-channel";
describe("single page-wide voice player", () => {
  function fake() {
    const els: { playing: boolean }[] = [];
    let playingCount = 0, maxPlaying = 0;
    _setVoiceFactory(() => {
      const st = { playing: false }; els.push(st);
      return { src: "", onended: null, onerror: null,
        pause() { if (st.playing) { st.playing = false; playingCount--; } },
        async play() { await Promise.resolve(); if (!st.playing) { st.playing = true; playingCount++; maxPlaying = Math.max(maxPlaying, playingCount); } } };
    });
    return { els, max: () => maxPlaying };
  }
  it("rapid line changes never play two clips at once and use one element", async () => {
    const f = fake();
    const runs = [];
    for (let i = 0; i < 20; i++) { const t = nextTurn(); runs.push(playVoice(t, `clip${i}`, () => {})); }
    await Promise.all(runs);
    expect(f.els.length).toBe(1);
    expect(f.max()).toBe(1);
  });
  it("a clip that arrives after its turn has passed is dropped", async () => {
    fake();
    const old = nextTurn(); nextTurn();
    expect(await playVoice(old, "late", () => {})).toBe(false);
    expect(voiceOverlapsBlocked()).toBe(1);
  });
});
