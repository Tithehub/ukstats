// Pure parser for official weather warnings published as OASIS CAP inside an Atom feed.
// Used by Meteoalarm (EUMETNET national weather services) and the US National Weather
// Service. No network here — the caller fetches, this only reads what arrived.

export type AlertColour = "yellow" | "orange" | "red";

export interface Alert {
  /** Meteoalarm colours the warning; other services do not, so this can be null. */
  colour: AlertColour | null;
  event: string;
  area: string;
  severity: string;
  expires: string | null;
  title: string;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decode(s: string): string {
  return s
    .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (all, code: string) => {
      if (code[0] === "#") {
        const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : all;
      }
      return ENTITIES[code] ?? all;
    })
    .replace(/<[^>]*>/g, "")
    .trim();
}

function tag(body: string, name: string): string | null {
  const m = body.match(new RegExp(`<cap:${name}[^>]*>([\\s\\S]*?)</cap:${name}>`));
  if (m) return decode(m[1]);
  const plain = body.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return plain ? decode(plain[1]) : null;
}

/** Split an Atom feed into its warnings. Entries without a CAP event are ignored. */
export function parseCapFeed(xml: string): Alert[] {
  const out: Alert[] = [];
  for (const chunk of xml.split(/<entry[\s>]/).slice(1)) {
    const body = chunk.split("</entry>")[0];
    const event = tag(body, "event");
    if (!event) continue;
    const title = tag(body, "title") ?? "";
    const first = title.split(/[\s-]+/)[0]?.toLowerCase() ?? "";
    const colour: AlertColour | null =
      first === "yellow" || first === "orange" || first === "red" ? first : null;
    out.push({
      colour,
      event,
      area: tag(body, "areaDesc") ?? "",
      severity: tag(body, "severity") ?? "",
      expires: tag(body, "expires") ?? tag(body, "cap:expires"),
      title,
    });
  }
  return out;
}

const RANK: Record<AlertColour, number> = { yellow: 1, orange: 2, red: 3 };

/** Highest colour present, or null when no warning carries a colour. */
export function worstColour(alerts: Alert[]): AlertColour | null {
  let worst: AlertColour | null = null;
  for (const a of alerts) if (a.colour && (!worst || RANK[a.colour] > RANK[worst])) worst = a.colour;
  return worst;
}

/** Most frequent event type, with how many areas it covers. */
export function mainEvent(alerts: Alert[]): { event: string; areas: number } | null {
  const counts = new Map<string, number>();
  for (const a of alerts) counts.set(a.event, (counts.get(a.event) ?? 0) + 1);
  let best: { event: string; areas: number } | null = null;
  for (const [event, areas] of counts) if (!best || areas > best.areas) best = { event, areas };
  return best;
}
