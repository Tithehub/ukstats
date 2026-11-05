import type { StreamCamera } from "./stream-cameras";

// TfL JamCams via api.tfl.gov.uk/Place/Type/JamCam — TfL open data, reusable with attribution.
const CHECKED = "2026-11-05";
const tfl = (id: string, place: string, keywords: string[]): StreamCamera => ({
  id: `tfl-${id}`, operator: "Transport for London", place, country: "united kingdom",
  videoUrl: `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/${id}.mp4`,
  imageUrl: `https://s3-eu-west-1.amazonaws.com/jamcams.tfl.gov.uk/${id}.jpg`,
  licence: "Powered by TfL Open Data", licenceUrl: "https://tfl.gov.uk/corporate/terms-and-conditions/transport-data-service",
  refreshSeconds: 300, checkedAt: CHECKED, keywords,
});

export const STREAM_CAMERAS: StreamCamera[] = [
  tfl("00001.06501", "Parliament Square, London", ["boat", "migration", "asylum", "arrival", "visa", "debt", "borrowing", "election", "poll"]),
  tfl("00001.04502", "Westminster Bridge, London", ["nhs", "waiting", "hospital", "health"]),
  tfl("00001.03500", "Tower Bridge approach, London", ["inflation", "gdp", "price", "interest", "rate", "wage", "earnings", "unemployment"]),
  tfl("00001.07450", "Piccadilly Circus, London", ["crime", "police", "population", "rent", "house"]),
  tfl("00001.06502", "Trafalgar Square, London", []),
];
