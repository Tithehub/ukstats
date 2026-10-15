// Shared button/control vocabulary so every page uses the same sizes, states
// and focus treatment. Touch targets are at least 44px tall on every variant.

import {
  Activity,
  AlertTriangle,
  Banknote,
  Building2,
  CloudSun,
  Landmark,
  LifeBuoy,
  type LucideIcon,
  Map as MapIcon,
  Plane,
  Shield,
  ShieldAlert,
  ShoppingBasket,
  Stethoscope,
  Users,
  Vote,
} from "lucide-react";
import type { Category } from "@/lib/uk-stats";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "toggle" | "danger";
export type ButtonSize = "sm" | "md";

const BASE =
  "inline-flex select-none items-center justify-center gap-1.5 rounded-md font-medium leading-none " +
  "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric " +
  "disabled:pointer-events-none disabled:opacity-50";

// min-h keeps the hit area comfortable on touch even when the label is tiny.
const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-11 px-2.5 py-1.5 text-[12px]",
  md: "min-h-11 px-3.5 py-2.5 text-[13px]",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-electric text-night hover:opacity-90 active:opacity-80",
  secondary:
    "border border-night-line/70 bg-night-panel/50 text-night-fg hover:border-electric hover:text-electric-soft",
  ghost: "text-night-muted hover:bg-night-panel hover:text-night-fg",
  toggle: "border border-night-line/70 text-night-muted hover:border-electric hover:text-electric-soft",
  danger: "border border-overdue/50 text-overdue hover:bg-overdue/10",
};

/** Class string for a button, link-button or toggle. */
export function btn(variant: ButtonVariant = "secondary", size: ButtonSize = "md", extra = ""): string {
  return `${BASE} ${SIZES[size]} ${VARIANTS[variant]} ${extra}`.trim();
}

/** Class string for a toggle that reflects pressed state. */
export function btnToggle(active: boolean, size: ButtonSize = "md", extra = ""): string {
  return active
    ? `${BASE} ${SIZES[size]} bg-electric text-night ${extra}`.trim()
    : btn("toggle", size, extra);
}

/** Square icon-only control. Sized to stay tappable. */
export function iconBtn(extra = ""): string {
  return (
    "grid size-11 shrink-0 place-items-center rounded-md border border-night-line/70 text-night-muted " +
    "transition-colors hover:border-electric hover:text-night-fg focus-visible:outline-2 " +
    `focus-visible:outline-offset-2 focus-visible:outline-electric ${extra}`
  ).trim();
}

/** An icon for every register category, so sections read at a glance. */
export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  Finance: Banknote,
  "Cost of living": ShoppingBasket,
  Crime: ShieldAlert,
  "Population & migration": Users,
  Immigration: Plane,
  Housing: Building2,
  Weather: CloudSun,
  "Defence & security": Shield,
  "National alerts": AlertTriangle,
  "NHS & doctors": Stethoscope,
  "Politics & polling": Vote,
  "Irregular immigration & cost": LifeBuoy,
};

export const FALLBACK_CATEGORY_ICON: LucideIcon = Activity;

export function categoryIcon(category: string): LucideIcon {
  return CATEGORY_ICON[category as Category] ?? FALLBACK_CATEGORY_ICON;
}

export const PAGE_ICON = { map: MapIcon, gov: Landmark } as const;
