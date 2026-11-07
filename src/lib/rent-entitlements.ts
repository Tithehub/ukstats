// Rented ("white-label") stream channels: what a customer is allowed to show.
// Branding only — figures always come from UKStats with their provenance.
import { COUNTRIES } from "@/lib/countries";

export type RentLayoutChoice = "classic" | "data-wall" | "split" | "portrait";
export const RENT_LAYOUTS: RentLayoutChoice[] = ["classic", "data-wall", "split", "portrait"];

export interface Entitlement {
  active: boolean;
  max_countries: number;
  all_countries: boolean;
  ai_presenter: boolean;
  no_sponsor_box: boolean;
  expires_at: string | null;
}

export interface ChannelSettings {
  slug: string;
  display_name: string;
  logo_url: string | null;
  accent: string;
  presented_by: string | null;
  layout: RentLayoutChoice;
  countries: string[];
  all_countries: boolean;
  presenter: "ai" | "self";
  show_sponsor_box: boolean;
}

export const NO_ENTITLEMENT: Entitlement = { active: false, max_countries: 1, all_countries: false, ai_presenter: false, no_sponsor_box: false, expires_at: null };

/** Used for storing and previewing a customer's wishes; the live stream is always clamped to the real entitlement. */
export const WISH_ENTITLEMENT: Entitlement = { active: true, max_countries: 300, all_countries: true, ai_presenter: true, no_sponsor_box: true, expires_at: null };

/** All country codes a channel may pick: "gb" for the UK plus every register country. */
export const RENT_COUNTRY_CODES = ["gb", ...COUNTRIES.map((c) => c.code)];

export function isChannelLive(e: Entitlement | null | undefined, now: Date): boolean {
  if (!e?.active) return false;
  return !e.expires_at || new Date(e.expires_at).getTime() > now.getTime();
}

export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
export const validSlug = (s: string) => /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(s);
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Clamp requested settings to what the entitlement allows. Never trusts the client. */
export function clampChannel(req: ChannelSettings, e: Entitlement, ownerId?: string): ChannelSettings {
  const known = [...new Set(req.countries.map((c) => c.toLowerCase()))].filter((c) => RENT_COUNTRY_CODES.includes(c));
  const allowAll = e.all_countries && req.all_countries;
  const countries = (known.length ? known : ["gb"]).slice(0, Math.max(1, e.max_countries));
  const own = (v: string) => v.startsWith("storage:") && (!ownerId || v.startsWith(`storage:${ownerId}/`)) && /^storage:[0-9a-f-]{36}\/[\w.-]{1,80}$/.test(v);
  const logo = req.logo_url && (/^https:\/\/[^\s"'<>]+$/.test(req.logo_url) || own(req.logo_url)) ? req.logo_url.slice(0, 500) : null;
  return {
    slug: req.slug,
    display_name: req.display_name.trim().slice(0, 60) || "My channel",
    logo_url: logo,
    accent: HEX.test(req.accent) ? req.accent : "#051D3F",
    presented_by: req.presented_by?.trim().slice(0, 80) || null,
    layout: RENT_LAYOUTS.includes(req.layout) ? req.layout : "classic",
    countries: allowAll ? RENT_COUNTRY_CODES : countries,
    all_countries: allowAll,
    presenter: req.presenter === "ai" && e.ai_presenter ? "ai" : "self",
    show_sponsor_box: e.no_sponsor_box ? req.show_sponsor_box : true,
  };
}
