/**
 * Real licensed UK racecourses: 59 in Great Britain (BHA list) plus Northern Ireland's two.
 * Dated snapshot — course facts only, no racing figures.
 */
export const RACECOURSES_CHECKED = "2026-11-09";
export const RACECOURSES_SOURCE = "https://www.britishhorseracing.com/";

export type Code = "Flat" | "Jumps" | "Flat & Jumps";
export interface Racecourse { id: string; name: string; town: string; nation: "England" | "Scotland" | "Wales" | "Northern Ireland"; code: Code; surface: "Turf" | "All-weather" | "Turf & all-weather" }

const F: Code = "Flat", J: Code = "Jumps", B: Code = "Flat & Jumps";
const raw: [string, string, Racecourse["nation"], Code, Racecourse["surface"]?][] = [
  ["Aintree", "Liverpool", "England", J], ["Ascot", "Ascot", "England", B], ["Ayr", "Ayr", "Scotland", B],
  ["Bangor-on-Dee", "Wrexham", "Wales", J], ["Bath", "Bath", "England", F], ["Beverley", "Beverley", "England", F],
  ["Brighton", "Brighton", "England", F], ["Carlisle", "Carlisle", "England", B], ["Cartmel", "Grange-over-Sands", "England", J],
  ["Catterick", "Catterick", "England", B], ["Chelmsford City", "Chelmsford", "England", F, "All-weather"], ["Cheltenham", "Cheltenham", "England", J],
  ["Chepstow", "Chepstow", "Wales", B], ["Chester", "Chester", "England", F], ["Doncaster", "Doncaster", "England", B],
  ["Epsom Downs", "Epsom", "England", F], ["Exeter", "Exeter", "England", J], ["Fakenham", "Fakenham", "England", J],
  ["Ffos Las", "Llanelli", "Wales", B], ["Fontwell Park", "Arundel", "England", J], ["Goodwood", "Chichester", "England", F],
  ["Great Yarmouth", "Great Yarmouth", "England", F], ["Hamilton Park", "Hamilton", "Scotland", F], ["Haydock Park", "Newton-le-Willows", "England", B],
  ["Hereford", "Hereford", "England", J], ["Hexham", "Hexham", "England", J], ["Huntingdon", "Huntingdon", "England", J],
  ["Kelso", "Kelso", "Scotland", J], ["Kempton Park", "Sunbury-on-Thames", "England", B, "Turf & all-weather"], ["Leicester", "Leicester", "England", B],
  ["Lingfield Park", "Lingfield", "England", B, "Turf & all-weather"], ["Ludlow", "Ludlow", "England", J], ["Market Rasen", "Market Rasen", "England", J],
  ["Musselburgh", "Musselburgh", "Scotland", B], ["Newbury", "Newbury", "England", B], ["Newcastle", "Newcastle upon Tyne", "England", B, "Turf & all-weather"],
  ["Newmarket", "Newmarket", "England", F], ["Newton Abbot", "Newton Abbot", "England", J], ["Nottingham", "Nottingham", "England", F],
  ["Perth", "Perth", "Scotland", J], ["Plumpton", "Lewes", "England", J], ["Pontefract", "Pontefract", "England", F],
  ["Redcar", "Redcar", "England", F], ["Ripon", "Ripon", "England", F], ["Salisbury", "Salisbury", "England", F],
  ["Sandown Park", "Esher", "England", B], ["Sedgefield", "Sedgefield", "England", J], ["Southwell", "Southwell", "England", B, "Turf & all-weather"],
  ["Stratford-on-Avon", "Stratford-upon-Avon", "England", J], ["Taunton", "Taunton", "England", J], ["Thirsk", "Thirsk", "England", F],
  ["Uttoxeter", "Uttoxeter", "England", J], ["Warwick", "Warwick", "England", J], ["Wetherby", "Wetherby", "England", B],
  ["Wincanton", "Wincanton", "England", J], ["Windsor", "Windsor", "England", F], ["Wolverhampton", "Wolverhampton", "England", F, "All-weather"],
  ["Worcester", "Worcester", "England", J], ["York", "York", "England", F],
  ["Down Royal", "Lisburn", "Northern Ireland", B], ["Downpatrick", "Downpatrick", "Northern Ireland", J],
];

export const RACECOURSES: Racecourse[] = raw.map(([name, town, nation, code, surface]) => ({
  id: name.toLowerCase().replace(/[^a-z]+/g, "-"), name, town, nation, code, surface: surface ?? "Turf",
}));
