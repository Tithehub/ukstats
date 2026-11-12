// Pure game logic for Lowe's Mission (parody arcade game). No statistics involved.
export const W = 800, H = 450, GROUND = 410;
export const GRAVITY = 1700, FLAP = -500, SPEED = 230, PLAYER_X = 170, PLAYER_R = 20;
export const JOURNEY = 24000;
export const STAGES = [
  { at: 0, name: "10 Downing Street", bg: 0 },
  { at: 0.15, name: "Watford", bg: 0 },
  { at: 0.3, name: "Milton Keynes", bg: 1 },
  { at: 0.5, name: "Birmingham", bg: 1 },
  { at: 0.7, name: "Stoke", bg: 1 },
  { at: 0.85, name: "Manchester", bg: 2 },
] as const;
export const BOSS_AT = [0.15, 0.5, 0.85] as const;
export const BOSS_HP = 3, BOSS_X = W - 130, BOSS_R = 55;
export const HEADLINES = ["EXPENSES ROW", "U-TURN!", "LEAKED MEMO", "DONOR DINNER", "WHO PAID?", "SLEAZE PROBE", "PARTY-GATE 2"];
export const RIVALS = ["badenoch", "mahmood", "rayner", "khan", "polanski"] as const;
export type Rival = (typeof RIVALS)[number];
export const RIVAL_NAMES: Record<Rival, string> = { badenoch: "KEMI HAD ENOUGH", mahmood: "BANANA MAHMOOD", rayner: "ANGELA RAVER", khan: "SADIQ CAN'T", polanski: "ZACK BOOBANSKI" };
export const HERO_NAME = "RUPERT AIM HIGH VOTE LOWE", BOSS_NAME = "ANDY BIRDMAN", FINAL_BOSS_NAME = "MASTERMIND";

export type Difficulty = "easy" | "normal" | "hard";
export const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];
export const LEVELS: Record<Difficulty, { label: string; speed: number; gap: number; rival: number; bossHp: number; tape: number }> = {
  easy: { label: "Easy", speed: 0.82, gap: 35, rival: 1.25, bossHp: 2, tape: 1.5 },
  normal: { label: "Normal", speed: 1, gap: 0, rival: 1, bossHp: 3, tape: 1 },
  hard: { label: "Hard", speed: 1.2, gap: -25, rival: 0.75, bossHp: 4, tape: 0.7 },
};
export const PUNCH_TIME = 0.35, PUNCH_COOLDOWN = 3, PUNCH_REACH = 26;
/** Generous upper bound for a genuine run; anything higher is rejected by the leaderboard. */
export function maxPlausibleScore(d: Difficulty, seconds: number) {
  const secs = Math.max(0, Math.min(seconds, 900));
  return Math.floor(secs * (70 + LEVELS[d].speed * 20)) + 4 * 300 + 500 + 200;
}
export type Column = { x: number; gapY: number; gap: number; headline: string };
export type Riot = { x: number; h: number };
export type Vote = { x: number; y: number; taken: boolean; poppy?: boolean };
export type Flyer = { x: number; y: number; who: Rival; vy: number; smashed: number };
export type Tape = { x: number; y: number; vy: number };
export const FLEE_TIME = 2.2;
export type Boss = { hp: number; x: number; y: number; t: number; cooldown: number; invuln: number; enter: number; flee: number; mastermind?: boolean };
export type Runner = { x: number; y: number; t: number; mastermind?: boolean };
export type State = {
  y: number; vy: number; dist: number; votes: number; poppies: number; smashed: number; power: number; bossesBeaten: number;
  difficulty: Difficulty; punch: number; punchCd: number;
  over: boolean; won: boolean; cause: string;
  columns: Column[]; riots: Riot[]; voteList: Vote[]; flyers: Flyer[]; tapes: Tape[];
  boss: Boss | null; runners: Runner[]; bossIndex: number; nextSpawn: number; nextRival: number; seed: number;
};

export function rng(seed: number) { const s = (seed * 1103515245 + 12345) % 2147483648; return [s, s / 2147483648] as const; }

export function newGame(seed = 1, difficulty: Difficulty = "normal"): State {
  return { y: H / 2, vy: 0, dist: 0, votes: 0, poppies: 0, smashed: 0, power: 0, difficulty, punch: 0, punchCd: 0, bossesBeaten: 0, over: false, won: false, cause: "",
    columns: [], riots: [], voteList: [], flyers: [], tapes: [], boss: null, runners: [], bossIndex: 0, nextSpawn: 500, nextRival: 1400, seed };
}

export function progress(dist: number) { return Math.min(1, dist / JOURNEY); }
export function stageAt(dist: number) { const p = progress(dist); let s: (typeof STAGES)[number] = STAGES[0]; for (const st of STAGES) if (p >= st.at) s = st; return s; }
export function score(s: Pick<State, "votes" | "smashed" | "bossesBeaten" | "dist" | "won"> & { poppies?: number; power?: number }) {
  return s.votes * 10 + (s.poppies ?? 0) * 25 + s.smashed * 50 + (s.power ?? 0) * 50 + s.bossesBeaten * 300 + Math.floor(s.dist / 100) + (s.won ? 500 : 0);
}
export function hitsBox(cx: number, cy: number, r: number, x: number, y: number, w: number, h: number) {
  const nx = Math.max(x, Math.min(cx, x + w)), ny = Math.max(y, Math.min(cy, y + h));
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

export const COL_W = 70;
export function step(s: State, dt: number, flap: boolean, punch = false): State {
  if (s.over) return s;
  const L = LEVELS[s.difficulty ?? "normal"];
  const n: State = { ...s, columns: [...s.columns], riots: [...s.riots], voteList: [...s.voteList], flyers: [...s.flyers], tapes: [...s.tapes], runners: s.runners.map((r) => ({ ...r, x: r.x + 420 * dt, t: r.t + dt })).filter((r) => r.x < W + 200), boss: s.boss ? { ...s.boss } : null };
  if (flap) n.vy = FLAP;
  n.punch = Math.max(0, n.punch - dt); n.punchCd = Math.max(0, n.punchCd - dt);
  if (punch && n.punchCd === 0) { n.punch = PUNCH_TIME; n.punchCd = PUNCH_COOLDOWN; }
  const reach = PLAYER_R + (n.punch > 0 ? PUNCH_REACH : 0);
  n.vy += GRAVITY * dt; n.y += n.vy * dt;
  const dx = SPEED * L.speed * (1 + progress(n.dist) * 0.35) * dt;
  n.dist = Math.min(n.dist + dx, n.boss ? JOURNEY - 1 : JOURNEY);
  if (n.dist >= JOURNEY && !n.boss) { n.over = true; n.won = true; n.cause = "Mission complete — welcome to Manchester!"; return n; }
  const t = progress(n.dist);
  let r: number;
  // boss arrival
  const nextBoss = BOSS_AT[n.bossIndex];
  if (!n.boss && nextBoss !== undefined && t >= nextBoss) {
    n.boss = { hp: L.bossHp, x: BOSS_X, y: H / 2, t: 0, cooldown: 1.2, invuln: 0, enter: 1, flee: 0 };
    n.bossIndex++;
  }
  if (n.boss) {
    const b = n.boss;
    b.flee = Math.max(0, b.flee - dt);
    b.t += dt; b.enter = Math.max(0, b.enter - dt); b.invuln = Math.max(0, b.invuln - dt); b.cooldown -= dt;
    b.y = H / 2 - 40 + Math.sin(b.t * 1.6) * 120;
    // every 4s he lunges left toward the hero, then drifts back: that's the moment to ram him
    const phase = b.t % 4;
    b.x = phase > 2.6 ? BOSS_X - Math.sin(((phase - 2.6) / 1.4) * Math.PI) * (BOSS_X - PLAYER_X - 40) : BOSS_X;
    // after each hit he runs away off the right edge, then comes back
    if (b.flee > 0) { b.x = PLAYER_X + 60 + Math.sin((1 - b.flee / FLEE_TIME) * Math.PI) * (W + 200 - PLAYER_X); b.t = 0; }
    // red tape only in the very last fight (MASTERMIND)
    if (b.mastermind && b.cooldown <= 0 && b.enter === 0 && b.flee === 0) {
      [n.seed, r] = rng(n.seed);
      n.tapes.push({ x: BOSS_X - 40, y: b.y, vy: (n.y - b.y) * 0.6 + (r - 0.5) * 80 });
      b.cooldown = 0.7 * L.tape;
    }
  } else {
    if (n.dist >= n.nextSpawn) {
      [n.seed, r] = rng(n.seed);
      const gap = 175 + L.gap - t * 35, gapY = 90 + r * (GROUND - 180 - gap);
      [n.seed, r] = rng(n.seed);
      n.columns.push({ x: W + 20, gapY, gap, headline: HEADLINES[Math.floor(r * HEADLINES.length)] ?? "SCANDAL" });
      n.voteList.push({ x: W + 20 + COL_W / 2, y: gapY + gap / 2, taken: false });
      [n.seed, r] = rng(n.seed);
      if (r < 0.55) n.riots.push({ x: W + 20 + COL_W + 110, h: 40 + r * 40 });
      n.voteList.push({ x: W + 20 + COL_W + 150, y: gapY + gap / 2 - 30, taken: false });
      [n.seed, r] = rng(n.seed);
      if (r < 0.4) n.voteList.push({ x: W + 20 + COL_W + 230, y: gapY + gap / 2 + 20, taken: false, poppy: true });
      n.nextSpawn = n.dist + 330 - t * 60;
    }
    if (n.dist >= n.nextRival) {
      [n.seed, r] = rng(n.seed); const y = 60 + r * (GROUND - 140);
      [n.seed, r] = rng(n.seed);
      n.flyers.push({ x: W + 60, y, who: RIVALS[Math.floor(r * RIVALS.length)] ?? "badenoch", vy: (r - 0.5) * 60, smashed: 0 });
      n.nextRival = n.dist + (1100 - t * 400) * L.rival;
    }
  }
  n.columns = n.columns.map((c) => ({ ...c, x: c.x - dx })).filter((c) => c.x > -COL_W - 10);
  n.riots = n.riots.map((c) => ({ ...c, x: c.x - dx })).filter((c) => c.x > -80);
  n.voteList = n.voteList.map((c) => ({ ...c, x: c.x - dx })).filter((c) => c.x > -20);
  n.flyers = n.flyers.map((f) => f.smashed ? { ...f, x: f.x + 500 * dt, y: f.y - 700 * dt, smashed: f.smashed + dt } : { ...f, x: f.x - dx - 140 * dt, y: f.y + f.vy * dt })
    .filter((f) => f.x > -80 && f.smashed < 1.2);
  n.tapes = n.tapes.map((p) => ({ ...p, x: p.x - 380 * dt, y: p.y + p.vy * dt })).filter((p) => p.x > -30);
  // collisions
  if (n.y - PLAYER_R < 0) { n.y = PLAYER_R; n.vy = 0; }
  if (n.y + PLAYER_R >= GROUND) { n.over = true; n.cause = "Fell into the gutter press"; return n; }
  if (n.punch > 0) {
    const i = n.columns.findIndex((c) => hitsBox(PLAYER_X + PUNCH_REACH, n.y, reach, c.x, 0, COL_W, GROUND));
    if (i >= 0) { n.columns.splice(i, 1); n.power++; n.punch = 0; }
  }
  for (const c of n.columns) {
    if (hitsBox(PLAYER_X, n.y, PLAYER_R, c.x, 0, COL_W, c.gapY) || hitsBox(PLAYER_X, n.y, PLAYER_R, c.x, c.gapY + c.gap, COL_W, GROUND - c.gapY - c.gap)) {
      n.over = true; n.cause = `Caught in a scandal: "${c.headline}"`; return n;
    }
  }
  for (const rt of n.riots) if (hitsBox(PLAYER_X, n.y, PLAYER_R, rt.x, GROUND - rt.h, 60, rt.h)) { n.over = true; n.cause = "Tripped over a riot barricade"; return n; }
  for (const p of n.tapes) if ((p.x - PLAYER_X) ** 2 + (p.y - n.y) ** 2 < (PLAYER_R + 12) ** 2) { n.over = true; n.cause = "Tied up in MASTERMIND's red tape"; return n; }
  n.flyers = n.flyers.map((f) => {
    if (!f.smashed && (f.x - PLAYER_X) ** 2 + (f.y - n.y) ** 2 < (reach + 28) ** 2) { n.smashed++; if (n.punch > 0) n.power++; return { ...f, smashed: 0.001 }; }
    return f;
  });
  if (n.boss && n.boss.enter === 0 && n.boss.invuln === 0 && n.boss.flee === 0 && (n.boss.x - PLAYER_X) ** 2 + (n.boss.y - n.y) ** 2 < (BOSS_R + reach) ** 2) {
    n.boss.hp--; n.boss.invuln = FLEE_TIME; n.boss.flee = FLEE_TIME; n.vy = FLAP * 0.8; n.tapes = [];
    if (n.boss.hp <= 0) { n.bossesBeaten++; const last = !n.boss.mastermind && n.bossIndex === BOSS_AT.length; n.runners.push({ x: n.boss.x, y: n.boss.y, t: 0, mastermind: n.boss.mastermind }); n.boss = last ? { hp: L.bossHp, x: BOSS_X, y: H / 2, t: 0, cooldown: 1.5, invuln: 0, enter: 1, flee: 0, mastermind: true } : null; }
  }
  n.voteList = n.voteList.map((c) => { if (!c.taken && (c.x - PLAYER_X) ** 2 + (c.y - n.y) ** 2 < (PLAYER_R + 14) ** 2) { if (c.poppy) n.poppies++; else n.votes++; return { ...c, taken: true }; } return c; });
  return n;
}
