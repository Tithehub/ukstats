// Pure game logic for Burnham's Dash (parody arcade game). No statistics involved.
export const W = 800, H = 450, GROUND = 410;
export const GRAVITY = 1700, FLAP = -500, SPEED = 230, PLAYER_X = 170, PLAYER_R = 20;
export const JOURNEY = 24000; // px from Downing Street to Manchester
export const STAGES = [
  { at: 0, name: "10 Downing Street", bg: 0 },
  { at: 0.15, name: "Watford", bg: 0 },
  { at: 0.3, name: "Milton Keynes", bg: 1 },
  { at: 0.5, name: "Birmingham", bg: 1 },
  { at: 0.7, name: "Stoke", bg: 1 },
  { at: 0.85, name: "Manchester", bg: 2 },
] as const;
export const HEADLINES = ["EXPENSES ROW", "U-TURN!", "LEAKED MEMO", "DONOR DINNER", "WHO PAID?", "SLEAZE PROBE", "PARTY-GATE 2"];
export const RIVALS = ["farage", "lowe", "badenoch"] as const;
export type Rival = (typeof RIVALS)[number];

export type Column = { x: number; gapY: number; gap: number; headline: string; passed: boolean };
export type Riot = { x: number; h: number };
export type Coin = { x: number; y: number; taken: boolean };
export type Flyer = { x: number; y: number; who: Rival; vy: number };
export type State = {
  y: number; vy: number; dist: number; coins: number; over: boolean; won: boolean; cause: string;
  columns: Column[]; riots: Riot[]; coinList: Coin[]; flyers: Flyer[]; nextSpawn: number; nextRival: number; seed: number;
};

export function rng(seed: number) { const s = (seed * 1103515245 + 12345) % 2147483648; return [s, s / 2147483648] as const; }

export function newGame(seed = 1): State {
  return { y: H / 2, vy: 0, dist: 0, coins: 0, over: false, won: false, cause: "", columns: [], riots: [], coinList: [], flyers: [], nextSpawn: 500, nextRival: 2200, seed };
}

export function progress(dist: number) { return Math.min(1, dist / JOURNEY); }
export function stageAt(dist: number) { const p = progress(dist); let s: (typeof STAGES)[number] = STAGES[0]; for (const st of STAGES) if (p >= st.at) s = st; return s; }
export function score(s: Pick<State, "coins" | "dist" | "won">) { return s.coins * 10 + Math.floor(s.dist / 100) + (s.won ? 500 : 0); }

export function hitsBox(cx: number, cy: number, r: number, x: number, y: number, w: number, h: number) {
  const nx = Math.max(x, Math.min(cx, x + w)), ny = Math.max(y, Math.min(cy, y + h));
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

export const COL_W = 70;
export function step(s: State, dt: number, flap: boolean): State {
  if (s.over) return s;
  const n: State = { ...s, columns: [...s.columns], riots: [...s.riots], coinList: [...s.coinList], flyers: [...s.flyers] };
  if (flap) n.vy = FLAP;
  n.vy += GRAVITY * dt; n.y += n.vy * dt;
  const dx = SPEED * (1 + progress(n.dist) * 0.35) * dt;
  n.dist += dx;
  if (n.dist >= JOURNEY) { n.over = true; n.won = true; n.cause = "Made it to Manchester!"; return n; }
  const t = Math.min(1, n.dist / JOURNEY);
  // spawn
  if (n.dist >= n.nextSpawn) {
    let r: number; [n.seed, r] = rng(n.seed);
    const gap = 175 - t * 35, gapY = 90 + r * (GROUND - 180 - gap);
    [n.seed, r] = rng(n.seed);
    n.columns.push({ x: W + 20, gapY, gap, headline: HEADLINES[Math.floor(r * HEADLINES.length)] ?? "SCANDAL", passed: false });
    n.coinList.push({ x: W + 20 + COL_W / 2, y: gapY + gap / 2, taken: false });
    [n.seed, r] = rng(n.seed);
    if (r < 0.55) n.riots.push({ x: W + 20 + COL_W + 110, h: 40 + r * 40 });
    n.coinList.push({ x: W + 20 + COL_W + 150, y: gapY + gap / 2 - 30, taken: false });
    n.nextSpawn = n.dist + 330 - t * 60;
  }
  if (n.dist >= n.nextRival) {
    let r: number; [n.seed, r] = rng(n.seed); const y = 60 + r * (GROUND - 140);
    [n.seed, r] = rng(n.seed);
    n.flyers.push({ x: W + 60, y, who: RIVALS[Math.floor(r * 3)] ?? "farage", vy: (r - 0.5) * 60 });
    n.nextRival = n.dist + 1600 - t * 600;
  }
  n.columns = n.columns.map((c) => ({ ...c, x: c.x - dx })).filter((c) => c.x > -COL_W - 10);
  n.riots = n.riots.map((c) => ({ ...c, x: c.x - dx })).filter((c) => c.x > -80);
  n.coinList = n.coinList.map((c) => ({ ...c, x: c.x - dx })).filter((c) => c.x > -20);
  n.flyers = n.flyers.map((f) => ({ ...f, x: f.x - dx - 140 * dt, y: f.y + f.vy * dt })).filter((f) => f.x > -80);
  // collisions
  if (n.y - PLAYER_R < 0) { n.y = PLAYER_R; n.vy = 0; }
  if (n.y + PLAYER_R >= GROUND) { n.over = true; n.cause = "Fell into the gutter press"; return n; }
  for (const c of n.columns) {
    if (hitsBox(PLAYER_X, n.y, PLAYER_R, c.x, 0, COL_W, c.gapY) || hitsBox(PLAYER_X, n.y, PLAYER_R, c.x, c.gapY + c.gap, COL_W, GROUND - c.gapY - c.gap)) {
      n.over = true; n.cause = `Caught in a scandal: "${c.headline}"`; return n;
    }
  }
  for (const r of n.riots) if (hitsBox(PLAYER_X, n.y, PLAYER_R, r.x, GROUND - r.h, 60, r.h)) { n.over = true; n.cause = "Tripped over a riot barricade"; return n; }
  for (const f of n.flyers) if ((f.x - PLAYER_X) ** 2 + (f.y - n.y) ** 2 < (PLAYER_R + 26) ** 2) {
    n.over = true; n.cause = `Cornered by ${f.who === "farage" ? "Nigel Farage" : f.who === "lowe" ? "Rupert Lowe" : "Kemi Badenoch"}`; return n;
  }
  n.coinList = n.coinList.map((c) => { if (!c.taken && (c.x - PLAYER_X) ** 2 + (c.y - n.y) ** 2 < (PLAYER_R + 12) ** 2) { n.coins++; return { ...c, taken: true }; } return c; });
  return n;
}
