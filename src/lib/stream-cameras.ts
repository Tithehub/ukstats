// Live public cameras for the stream: only openly licensed feeds from a government or transport
// authority, pointed at public roads, bridges and squares. Never private, police or shop CCTV.

export const ALLOWED_CAMERA_OPERATORS = ["Transport for London"] as const;

export interface StreamCamera {
  id: string; operator: string; place: string; country: string;
  /** ~10-second loop the operator republishes every few minutes. */
  videoUrl: string; imageUrl: string; licence: string; licenceUrl: string;
  refreshSeconds: number; checkedAt: string;
  /** Words matched against the figure title; empty = general fallback for the country. */
  keywords: string[];
}

export function cameraAllowed(c: StreamCamera): boolean {
  return (ALLOWED_CAMERA_OPERATORS as readonly string[]).includes(c.operator);
}

/** Best camera for the figure on screen, or null (the clip box is used instead). */
export function cameraForCard(title: string, country: string | undefined, cams: StreamCamera[], skip: string[] = []): StreamCamera | null {
  const t = title.toLowerCase();
  const pool = cams.filter((c) => cameraAllowed(c) && c.country === country && !skip.includes(c.id));
  if (!pool.length) return null;
  const score = (c: StreamCamera) => c.keywords.filter((k) => t.includes(k)).length;
  return [...pool].sort((a, b) => score(b) - score(a))[0]!;
}

/** Cache-buster rounded to the operator's refresh window, so every viewer shares one copy per window. */
export const cameraSrc = (c: StreamCamera, now: number) => `${c.videoUrl}?t=${Math.floor(now / (c.refreshSeconds * 1000))}`;

export const cameraCaption = (c: StreamCamera) =>
  `LIVE public camera — ${c.operator}, ${c.place}. Shows the scene only, not the figure on screen.`;
