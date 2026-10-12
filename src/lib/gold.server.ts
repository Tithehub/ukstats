// Server-only: official gold reserves from the IMF. Failure → null, never a stale or estimated table.
import { parseImfGold, type GoldTable } from "@/lib/gold";

const TTL = 24 * 60 * 60_000;
let hit: { at: number; p: Promise<GoldTable | null> } | null = null;

function startPeriod(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 18, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function load(): Promise<GoldTable | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 45_000);
  try {
    const res = await fetch(
      `https://api.imf.org/external/sdmx/2.1/data/IMF.STA,IRFCL/.IRFCLDT1_IRFCL56V_FTO..M?startPeriod=${startPeriod()}&detail=dataonly`,
      { signal: ctrl.signal, headers: { accept: "application/vnd.sdmx.data+csv", "user-agent": "ukstats-register/1.0" } },
    );
    if (!res.ok) throw new Error(String(res.status));
    const table = parseImfGold(await res.text());
    if (!table || table.ranked.length === 0) throw new Error("no gold rows");
    return table;
  } finally {
    clearTimeout(t);
  }
}

export async function goldReserves(): Promise<{ table: GoldTable | null; fetchedAt: string | null; error: string | null }> {
  if (!hit || Date.now() - hit.at > TTL) {
    const p = load();
    hit = { at: Date.now(), p };
    p.catch(() => { hit = null; });
  }
  try {
    const table = await hit.p;
    return { table, fetchedAt: new Date(hit?.at ?? Date.now()).toISOString(), error: null };
  } catch (e) {
    return { table: null, fetchedAt: null, error: e instanceof Error ? e.message : "no response" };
  }
}
