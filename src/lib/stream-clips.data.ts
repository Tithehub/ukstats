// Dated snapshot of free-to-reuse footage for the live stream. Each entry was checked on its
// Wikimedia Commons file page (licence, author, date) on CHECKED. Clips were trimmed to 30s and muted.
import police from "@/assets/stream-clips/met_police_westminster.webm.asset.json";
import trafalgar from "@/assets/stream-clips/trafalgar_protest.webm.asset.json";
import march from "@/assets/stream-clips/london_march.webm.asset.json";
import thames from "@/assets/stream-clips/thames_city_london.webm.asset.json";
import nhs from "@/assets/stream-clips/nhs_protest_london.webm.asset.json";
import delhi from "@/assets/stream-clips/aircraft_landing_timelapse.webm.asset.json";
import ups from "@/assets/stream-clips/cargo_jet_landing.webm.asset.json";
import tripoli from "@/assets/stream-clips/uss_tripoli_f35_ops.webm.asset.json";
import tube from "@/assets/stream-clips/tube_waterloo.webm.asset.json";
import baTakeoff from "@/assets/stream-clips/heathrow_takeoff.webm.asset.json";
import cbp2009 from "@/assets/stream-clips/us_border_patrol_2009.webm.asset.json";
import t5 from "@/assets/stream-clips/heathrow_t5.webm.asset.json";
import melies from "@/assets/stream-clips/calais_dover_1897.webm.asset.json";
import cbp2022 from "@/assets/stream-clips/us_border_patrol_2022.webm.asset.json";
import arrivals from "@/assets/stream-clips/heathrow_arrivals.webm.asset.json";
import kings from "@/assets/stream-clips/kings_hospital_helicopter.webm.asset.json";
import bus from "@/assets/stream-clips/bus_house_of_commons.webm.asset.json";
import westminster from "@/assets/stream-clips/westminster_palace.webm.asset.json";
import ferry from "@/assets/stream-clips/calais_ferry.webm.asset.json";
import typhoonUk from "@/assets/stream-clips/raf_typhoon_uk.webm.asset.json";
import typhoonMirage from "@/assets/stream-clips/raf_typhoon_mirage.webm.asset.json";
import commons from "@/assets/stream-clips/commons_chamber.webm.asset.json";
import kentAmb from "@/assets/stream-clips/kent_air_ambulance_2025.webm.asset.json";
import glasgow from "@/assets/stream-clips/glasgow_2026.webm.asset.json";
import type { StreamClip } from "./stream-clips";

export const CHECKED = "2026-11-04T00:16:00Z";
export const CHECKED_2 = "2026-11-04T19:10:00Z";
export const CHECKED_3 = "2026-11-04T20:20:00Z";
const C = "https://commons.wikimedia.org/wiki/File:";

export const STREAM_CLIPS: StreamClip[] = [
  { id: "kent-air-ambulance", url: kentAmb.url, sourcePage: C + "Kent_Surrey_Sussex_Air_Ambulance_(G-LNAC)_Take-off.webm", licence: "CC BY 4.0", credit: "Celsoazevedo", publisher: "Wikimedia Commons", description: "Kent Surrey Sussex Air Ambulance taking off", published: "2025-04-17", topics: ["nhs"], checkedAt: CHECKED_3 },
  { id: "glasgow-2026", url: glasgow.url, sourcePage: C + "Explore_Europe_Glasgow_(1018751).webm", licence: "Public domain (US Government)", credit: "Staff Sgt. Gavin Lewis, US Air Force", publisher: "DVIDS", description: "Glasgow city centre", published: "2026-08-05", topics: ["cost", "economy", "news", "recap"], checkedAt: CHECKED_3 },
  { id: "thames", url: thames.url, sourcePage: C + "Mercuria_tour_boat_River_Thames_Bankside_Southwark_Bridge_Cannon_Street_Railway_Bridge_London_England_video.webm", licence: "CC BY-SA 4.0", credit: "Acabashi", publisher: "Wikimedia Commons", description: "River Thames by the City of London", published: "2025-09-22", topics: ["economy", "cost", "recap"], checkedAt: CHECKED },
  { id: "met-police", url: police.url, sourcePage: C + "(Police_BMW!)_Metropolitan_Police_responding_around_Westminster_Square!.webm", licence: "CC BY 3.0", credit: "112 South-West NL", publisher: "Wikimedia Commons", description: "Metropolitan Police vehicles in Westminster", published: "2023-10-23", topics: ["crime"], checkedAt: CHECKED },
  { id: "nhs-march", url: nhs.url, sourcePage: C + "NHS_No_Cuts_protest_in_London_5March2017.webm", licence: "CC BY 2.0", credit: "Su-May", publisher: "Wikimedia Commons", description: "NHS march in London", published: "2017-03-05", topics: ["nhs"], checkedAt: CHECKED },
  { id: "tripoli-f35", url: tripoli.url, sourcePage: C + "USS_Tripoli_F-35_Flight_Ops_(1003186).webm", licence: "Public domain (US Government)", credit: "US Navy — NAVCENT Public Affairs", publisher: "US Department of Defense", description: "F-35 flight operations aboard USS Tripoli", published: "2026-04-17", topics: ["security"], checkedAt: CHECKED },
  { id: "trafalgar", url: trafalgar.url, sourcePage: C + "Anti_Trump_Protest_Trafalgar_Square_London_July_13_2018.webm", licence: "CC BY 2.0", credit: "David Holt", publisher: "Wikimedia Commons", description: "Protest in Trafalgar Square, London", published: "2018-07-13", topics: ["warnings", "news"], checkedAt: CHECKED },
  { id: "london-march", url: march.url, sourcePage: C + "COP26_Climate_Change_Protest_March_London_November_6_2021.webm", licence: "CC BY 3.0", credit: "David Holt", publisher: "Wikimedia Commons", description: "March through central London", published: "2021-11-06", topics: ["warnings", "news", "world"], checkedAt: CHECKED },
  { id: "delhi-landing", url: delhi.url, sourcePage: C + "Timelapse_of_aircraft_landing_at_Delhi_airport,_India.webm", licence: "CC BY-SA 4.0", credit: "Chinmayee Mishra", publisher: "Wikimedia Commons", description: "Aircraft landing at Delhi airport (time-lapse)", published: "2024-08-12", topics: ["flights", "world"], checkedAt: CHECKED },
  { id: "ups-landing", url: ups.url, sourcePage: C + "UPS_MD11_(N259UP)_Landing_Portland_Airport.webm", licence: "CC BY 3.0", credit: "PDX Spotting", publisher: "Wikimedia Commons", description: "Cargo jet landing at Portland airport", published: "2020-10-18", topics: ["flights"], checkedAt: CHECKED },
  { id: "calais-ferry", url: ferry.url, sourcePage: C + 'Pride_of_Canterbury_(ship,_1991)_video_in_Calais_(1).ogg', licence: "CC BY-SA 4.0", credit: "Pierre André Leclercq", publisher: "Wikimedia Commons", description: "Cross-Channel ferry at Calais — not a small boat", published: "2022-09-07", topics: ["boats", "recap", "world"], checkedAt: CHECKED_2 },
  { id: "calais-dover-1897", url: melies.url, sourcePage: C + 'Entre_Calais_et_Douvres_(1897).webm', licence: "Public domain", credit: "Georges Méliès", publisher: "Wikimedia Commons", description: "Between Calais and Dover — 1897 archive film (staged)", published: "1897", topics: ["boats", "recap"], checkedAt: CHECKED_2 },
  { id: "westminster", url: westminster.url, sourcePage: C + 'Palace_of_Westminster_-_Making_the_building_watertight.webm', licence: "CC BY 3.0", credit: "UK Parliament", publisher: "Wikimedia Commons", description: "Palace of Westminster", published: "2013-11-07", topics: ["economy", "recap", "legal"], checkedAt: CHECKED_2 },
  { id: "commons-chamber", url: commons.url, sourcePage: C + 'The_Speaker_Explains_-_Keeping_Order_in_the_House_of_Commons.webm', licence: "Open Parliament Licence v3.0", credit: "UK Parliament", publisher: "Wikimedia Commons", description: "House of Commons chamber", published: "2019-04-05", topics: ["economy", "security", "recap"], checkedAt: CHECKED_2 },
  { id: "bus-commons", url: bus.url, sourcePage: C + 'London_United_LTZ1130_passing_House_of_Commons_in_May_2015.webm', licence: "CC BY 3.0", credit: "MC Browne", publisher: "Wikimedia Commons", description: "London bus passing the House of Commons", published: "2015-05-17", topics: ["cost", "economy"], checkedAt: CHECKED_2 },
  { id: "tube-waterloo", url: tube.url, sourcePage: C + 'Bakerloo_line_-_Waterloo.ogv', licence: "CC BY-SA 3.0", credit: "Clicsouris", publisher: "Wikimedia Commons", description: "Bakerloo line train at Waterloo", published: "2008-06", topics: ["cost"], checkedAt: CHECKED_2 },
  { id: "kings-helicopter", url: kings.url, sourcePage: C + 'Helicopter_landing_at_King’s_College_Hospital_Helipad_(2025-07-08).webm', licence: "CC BY 4.0", credit: "Celsoazevedo", publisher: "Wikimedia Commons", description: "Air ambulance landing at King's College Hospital, London", published: "2025-07-08", topics: ["nhs"], checkedAt: CHECKED_2 },
  { id: "typhoon-uk", url: typhoonUk.url, sourcePage: C + 'RAF_Typhoon_Flight_Over_the_UK.webm', licence: "OGL v3.0", credit: "Ministry of Defence", publisher: "Wikimedia Commons", description: "RAF Typhoon flying over the UK", published: "2015-03-09", topics: ["security"], checkedAt: CHECKED_2 },
  { id: "typhoon-mirage", url: typhoonMirage.url, sourcePage: C + 'Royal_Air_Force_Typhoon_flying_with_a_French_Mirage.webm', licence: "CC BY 4.0", credit: "Ministry of Defence", publisher: "Wikimedia Commons", description: "RAF Typhoon with a French Mirage", published: "2013", topics: ["security", "world"], checkedAt: CHECKED_2 },
  { id: "heathrow-arrivals", url: arrivals.url, sourcePage: C + 'Heathrow_Airport_Terminal_2_baggage_carousel_-_2017-08-18_-_Andy_Mabbett.ogv', licence: "CC BY-SA 4.0", credit: "Andy Mabbett", publisher: "Wikimedia Commons", description: "Arrivals baggage hall, Heathrow Terminal 2", published: "2017-08-18", topics: ["legal"], checkedAt: CHECKED_2 },
  { id: "heathrow-t5", url: t5.url, sourcePage: C + 'Cloud_Heathrow_Terminal_5_video.webm', licence: "CC BY 2.0", credit: "Phil Whitehouse", publisher: "Wikimedia Commons", description: "Heathrow Terminal 5", published: "2008-04-21", topics: ["legal", "flights"], checkedAt: CHECKED_2 },
  { id: "heathrow-takeoff", url: baTakeoff.url, sourcePage: C + 'British_Airways_Airbus_A320-200_G-EUUJ_BA1372_Take_off_from_London_Heathrow_2013-03-20.ogv', licence: "CC BY-SA 3.0", credit: "Reedy", publisher: "Wikimedia Commons", description: "Airliner taking off from Heathrow", published: "2013-03-20", topics: ["flights", "legal"], checkedAt: CHECKED_2 },
  { id: "cbp-2022", url: cbp2022.url, sourcePage: C + 'Go_Beyond_with_U.S._Border_Patrol.webm', licence: "Public domain (US Government)", credit: "U.S. Customs and Border Protection", publisher: "US Customs and Border Protection", description: "US Border Patrol on duty", published: "2022-02-02", topics: ["world"], country: "united states", checkedAt: CHECKED_2 },
  { id: "cbp-2009", url: cbp2009.url, sourcePage: C + 'CBP_Fronltine_News_-_U.S_Border_Patrol_Celebrates_85th_Anniversary.webm', licence: "Public domain (US Government)", credit: "U.S. Customs and Border Protection", publisher: "US Customs and Border Protection", description: "US Border Patrol — 2009 archive", published: "2009-08-05", topics: ["world"], country: "united states", checkedAt: CHECKED_2 },
];
