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
