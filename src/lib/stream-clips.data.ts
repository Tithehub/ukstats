// Dated snapshot of free-to-reuse footage for the live stream. Each entry was checked on its
// Wikimedia Commons file page (licence, author, date) on CHECKED. Clips were trimmed to 30s and muted.
import police from "@/assets/stream-clips/met_police_westminster.mp4.asset.json";
import trafalgar from "@/assets/stream-clips/trafalgar_protest.mp4.asset.json";
import march from "@/assets/stream-clips/london_march.mp4.asset.json";
import thames from "@/assets/stream-clips/thames_city_london.mp4.asset.json";
import nhs from "@/assets/stream-clips/nhs_protest_london.mp4.asset.json";
import delhi from "@/assets/stream-clips/aircraft_landing_timelapse.mp4.asset.json";
import ups from "@/assets/stream-clips/cargo_jet_landing.mp4.asset.json";
import tripoli from "@/assets/stream-clips/uss_tripoli_f35_ops.mp4.asset.json";
import type { StreamClip } from "./stream-clips";

export const CHECKED = "2026-11-04T00:16:00Z";
const C = "https://commons.wikimedia.org/wiki/File:";

export const STREAM_CLIPS: StreamClip[] = [
  { id: "thames", url: thames.url, sourcePage: C + "Mercuria_tour_boat_River_Thames_Bankside_Southwark_Bridge_Cannon_Street_Railway_Bridge_London_England_video.webm", licence: "CC BY-SA 4.0", credit: "Acabashi", publisher: "Wikimedia Commons", description: "River Thames by the City of London", published: "2025-09-22", topics: ["economy", "cost"], checkedAt: CHECKED },
  { id: "met-police", url: police.url, sourcePage: C + "(Police_BMW!)_Metropolitan_Police_responding_around_Westminster_Square!.webm", licence: "CC BY 3.0", credit: "112 South-West NL", publisher: "Wikimedia Commons", description: "Metropolitan Police vehicles in Westminster", published: "2023-10-23", topics: ["crime"], checkedAt: CHECKED },
  { id: "nhs-march", url: nhs.url, sourcePage: C + "NHS_No_Cuts_protest_in_London_5March2017.webm", licence: "CC BY 2.0", credit: "Su-May", publisher: "Wikimedia Commons", description: "NHS march in London", published: "2017-03-05", topics: ["nhs"], checkedAt: CHECKED },
  { id: "tripoli-f35", url: tripoli.url, sourcePage: C + "USS_Tripoli_F-35_Flight_Ops_(1003186).webm", licence: "Public domain (US Government)", credit: "US Navy — NAVCENT Public Affairs", publisher: "US Department of Defense", description: "F-35 flight operations aboard USS Tripoli", published: "2026-04-17", topics: ["security"], checkedAt: CHECKED },
  { id: "trafalgar", url: trafalgar.url, sourcePage: C + "Anti_Trump_Protest_Trafalgar_Square_London_July_13_2018.webm", licence: "CC BY 2.0", credit: "David Holt", publisher: "Wikimedia Commons", description: "Protest in Trafalgar Square, London", published: "2018-07-13", topics: ["warnings", "news"], checkedAt: CHECKED },
  { id: "london-march", url: march.url, sourcePage: C + "COP26_Climate_Change_Protest_March_London_November_6_2021.webm", licence: "CC BY 3.0", credit: "David Holt", publisher: "Wikimedia Commons", description: "March through central London", published: "2021-11-06", topics: ["warnings", "news"], checkedAt: CHECKED },
  { id: "delhi-landing", url: delhi.url, sourcePage: C + "Timelapse_of_aircraft_landing_at_Delhi_airport,_India.webm", licence: "CC BY-SA 4.0", credit: "Chinmayee Mishra", publisher: "Wikimedia Commons", description: "Aircraft landing at Delhi airport (time-lapse)", published: "2024-08-12", topics: ["flights"], checkedAt: CHECKED },
  { id: "ups-landing", url: ups.url, sourcePage: C + "UPS_MD11_(N259UP)_Landing_Portland_Airport.webm", licence: "CC BY 3.0", credit: "PDX Spotting", publisher: "Wikimedia Commons", description: "Cargo jet landing at Portland airport", published: "2020-10-18", topics: ["flights"], checkedAt: CHECKED },
];
