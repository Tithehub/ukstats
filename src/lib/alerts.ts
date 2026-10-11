// Pure parser for official weather warnings published as OASIS CAP inside an Atom feed.
// Used by Meteoalarm (EUMETNET national weather services). No network here — the caller
// fetches, this only reads what arrived, and never invents a warning.

export type AlertColour = "yellow" | "orange" | "red";

export interface Alert {
  /** Meteoalarm colours the warning; services that do not leave this null. */
  colour: AlertColour | null;
  event: string;
  area: string;
  severity: string;
  expires: string | null;
  title: string;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
// HTML 4 named entities for Latin-1, in code-point order from U+00A0.
const LATIN1 =
  "nbsp,iexcl,cent,pound,curren,yen,brvbar,sect,uml,copy,ordf,laquo,not,shy,reg,macr,deg,plusmn,sup2,sup3,acute,micro,para,middot,cedil,sup1,ordm,raquo,frac14,frac12,frac34,iquest,Agrave,Aacute,Acirc,Atilde,Auml,Aring,AElig,Ccedil,Egrave,Eacute,Ecirc,Euml,Igrave,Iacute,Icirc,Iuml,ETH,Ntilde,Ograve,Oacute,Ocirc,Otilde,Ouml,times,Oslash,Ugrave,Uacute,Ucirc,Uuml,Yacute,THORN,szlig,agrave,aacute,acirc,atilde,auml,aring,aelig,ccedil,egrave,eacute,ecirc,euml,igrave,iacute,icirc,iuml,eth,ntilde,ograve,oacute,ocirc,otilde,ouml,divide,oslash,ugrave,uacute,ucirc,uuml,yacute,thorn,yuml".split(",");
LATIN1.forEach((n, i) => {
  ENTITIES[n] = String.fromCodePoint(0xa0 + i);
});

function decode(s: string): string {
  return s
    .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (all, code: string) => {
      if (code[0] === "#") {
        const n = code[1]?.toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : all;
      }
      return ENTITIES[code] ?? all;
    })
    .replace(/<[^>]*>/g, "")
    .trim();
}

function tag(body: string, name: string): string | null {
  const cap = body.match(new RegExp(`<cap:${name}[^>]*>([\\s\\S]*?)</cap:${name}>`));
  if (cap) return decode(cap[1] ?? "");
  const plain = body.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return plain ? decode(plain[1] ?? "") : null;
}

/** Split an Atom feed into its warnings. Entries without a CAP event are ignored. */
export function parseCapFeed(xml: string): Alert[] {
  const out: Alert[] = [];
  for (const chunk of xml.split(/<entry[\s>]/).slice(1)) {
    const body = chunk.split("</entry>")[0] ?? "";
    const event = tag(body, "event");
    if (!event) continue;
    const title = tag(body, "title") ?? "";
    const first = title.split(/[\s-]+/)[0]?.toLowerCase() ?? "";
    const colour: AlertColour | null = first === "yellow" || first === "orange" || first === "red" ? first : null;
    out.push({
      colour,
      event,
      area: tag(body, "areaDesc") ?? "",
      severity: tag(body, "severity") ?? "",
      expires: tag(body, "expires"),
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
