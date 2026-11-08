// Freely licensed Wikimedia Commons photos (checked 2026-11-08), stored as site assets.
// Places, buildings or archive scenes only — never photos of living people named in a scandal.
import grooming from "@/assets/scandals/grooming-gangs.jpg.asset.json";
import postOffice from "@/assets/scandals/post-office-horizon.jpg.asset.json";
import epstein from "@/assets/scandals/epstein-files.jpg.asset.json";
import savile from "@/assets/scandals/jimmy-savile.jpg.asset.json";
import bbc from "@/assets/scandals/bbc-trump-edit.jpg.asset.json";
import diana from "@/assets/scandals/princess-diana.jpg.asset.json";
import covid from "@/assets/scandals/covid-vaccines.jpg.asset.json";
import ufo from "@/assets/scandals/ufo-disclosure.jpg.asset.json";
import iraq from "@/assets/scandals/iraq-war.jpg.asset.json";
import iran from "@/assets/scandals/iran-war.jpg.asset.json";
import falklands from "@/assets/scandals/falklands.jpg.asset.json";
import clinton from "@/assets/scandals/bill-clinton.jpg.asset.json";
import boats from "@/assets/scandals/boat-crossings.jpg.asset.json";
import jury from "@/assets/scandals/jury-trials.jpg.asset.json";
import dei from "@/assets/scandals/dei-arday.jpg.asset.json";
import kirk from "@/assets/scandals/kirk.jpg.asset.json";
import dando from "@/assets/scandals/dando.jpg.asset.json";
import widd from "@/assets/scandals/widd.jpg.asset.json";

export type ScandalImage = { src: string; alt: string; credit: string; licence: string; sourceUrl: string };

const c = (f: string) => `https://commons.wikimedia.org/wiki/File:${f}`;

export const SCANDAL_IMAGES: Partial<Record<string, ScandalImage>> = {
  "grooming-gangs": { src: grooming.url, alt: "Rotherham town centre", credit: "Ben Sutherland", licence: "CC BY 2.0", sourceUrl: c("Rotherham_town_centre,_May_2010.jpg") },
  "post-office-horizon": { src: postOffice.url, alt: "A Post Office branch in Coventry", credit: "Keith Williams", licence: "CC BY-SA 2.0", sourceUrl: c("Coventry_Post_Office_-_geograph.org.uk_-_761307.jpg") },
  "epstein-files": { src: epstein.url, alt: "Little St James Island, US Virgin Islands", credit: "Navin75", licence: "CC BY-SA 2.0", sourceUrl: c("Little_St_James_Island_(9123420726).jpg") },
  "jimmy-savile": { src: savile.url, alt: "BBC Broadcasting House, London", credit: "Paul Gillett", licence: "CC BY-SA 2.0", sourceUrl: c("BBC_Broadcasting_House,_London_-_geograph.org.uk_-_4148694.jpg") },
  "bbc-trump-edit": { src: bbc.url, alt: "BBC Broadcasting House new building, London", credit: "Paul Gillett", licence: "CC BY-SA 2.0", sourceUrl: c("BBC_Broadcasting_House,_New_Building_-_geograph.org.uk_-_4148712.jpg") },
  "princess-diana": { src: diana.url, alt: "West entrance to the Pont de l'Alma tunnel, Paris", credit: "Alexf", licence: "CC BY-SA 4.0", sourceUrl: c("West_entrance_to_the_Pont_de_l%27Alma_tunnel_in_Paris,_where_Princess_Diana_died.jpg") },
  "covid-vaccines": { src: covid.url, alt: "COVID-19 vaccination centre, Llandudno, February 2021", credit: "Richard Hoare", licence: "CC BY-SA 2.0", sourceUrl: c("-2021-02-05_COVID-19_Vaccination_centre,_Llandudno.jpg") },
  "ufo-disclosure": { src: ufo.url, alt: "Aerial view of the Pentagon", credit: "mariordo59", licence: "CC BY-SA 2.0", sourceUrl: c("Aerial_view_of_the_Pentagon,_Arlington,_VA_(38285035892).jpg") },
  "iraq-war": { src: iraq.url, alt: "US tanks in Baghdad, 2003", credit: "TSgt John L. Houghton Jr., US Air Force", licence: "Public domain", sourceUrl: c("UStanks_baghdad_2003.JPEG") },
  "iran-war": { src: iran.url, alt: "Tehran skyline with Milad Tower and the Alborz mountains", credit: "Julia Maudlin", licence: "CC BY 2.0", sourceUrl: c("Tehran_Skyline,_Milad_Tower_and_Alborz_Mountains,_Iran_(10059004754).jpg") },
  falklands: { src: falklands.url, alt: "SS Canberra and HMS Andromeda, Falklands 1982", credit: "Ken Griffiths", licence: "Public domain", sourceUrl: c("SS_Canberra_%26_HMS_Andromeda_Falklands_1982.jpg") },
  "bill-clinton": { src: clinton.url, alt: "North façade of the White House", credit: "Nishkid64", licence: "Public domain", sourceUrl: c("North_Fa%C3%A7ade_White_House.JPG") },
  "boat-crossings": { src: boats.url, alt: "The English Channel with the white cliffs of Dover", credit: "Timitrius", licence: "CC BY-SA 2.0", sourceUrl: c("Crossing_the_English_Channel_(Le_Manche)._White_cliffs_of_Dover_in_background.jpg") },
  "jury-trials-curbed": { src: jury.url, alt: "The Central Criminal Court (Old Bailey), London", credit: "David Hillas", licence: "CC BY-SA 2.0", sourceUrl: c("Central_Criminal_Court,_Old_Bailey_(1)_-_geograph.org.uk_-_5417080.jpg") },
  "dei-jason-arday": { src: dei.url, alt: "Senate House, University of Cambridge", credit: "The wub", licence: "CC BY-SA 3.0", sourceUrl: c("Senate_House,_Cambridge.jpg") },
  "charlie-kirk": { src: kirk.url, alt: "Utah Valley University campus building", credit: "An Errant Knight", licence: "CC BY-SA 4.0", sourceUrl: c("East_side_of_Utah_Valley_University_Wasatch_Campus_building,_Apr_16.jpg") },
  "jill-dando": { src: dando.url, alt: "BBC Television Centre, London", credit: "Panhard", licence: "CC BY 2.5", sourceUrl: c("BBC_TV_Centre.jpg") },
  "ann-widdecombe": { src: widd.url, alt: "Haytor Rocks, Dartmoor", credit: "Archangel12", licence: "CC BY 2.0", sourceUrl: c("Dartmoor_-_Haytor_Rocks_(6238837326).jpg") },
};
