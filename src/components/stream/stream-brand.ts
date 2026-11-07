import type { PublicChannel } from "@/lib/rent-channel.functions";

/** Branding applied to a rented stream. Never carries or alters figures. */
export interface StreamBrand {
  name: string;
  logoUrl: string | null;
  accent: string;
  presentedBy: string | null;
  countries: string[];
  presenter: "ai" | "self";
  showSponsors: boolean;
}

export const brandFromChannel = (c: PublicChannel): StreamBrand => ({
  name: c.display_name, logoUrl: c.logo_url, accent: c.accent, presentedBy: c.presented_by,
  countries: c.countries, presenter: c.presenter, showSponsors: c.show_sponsor_box,
});
