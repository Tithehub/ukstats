import western from "@/assets/region-western.jpg";
import northern from "@/assets/region-northern.jpg";
import southern from "@/assets/region-southern.jpg";
import central from "@/assets/region-central.jpg";
import namerica from "@/assets/region-namerica.jpg";
import australia from "@/assets/region-australia.jpg";

const REGIONS = {
  western: { src: western, alt: "Old town square with civic buildings at dusk" },
  northern: { src: northern, alt: "Nordic harbour with wooden houses at dusk" },
  southern: { src: southern, alt: "Mediterranean hillside town above the sea" },
  central: { src: central, alt: "Central European river city with a stone bridge" },
  namerica: { src: namerica, alt: "North American city skyline across water" },
  australia: { src: australia, alt: "Australian harbour city at dusk" },
} as const;

const BY_CODE: Record<string, keyof typeof REGIONS> = {
  at: "central", be: "western", bg: "central", hr: "southern", cy: "southern", cz: "central", dk: "northern",
  ee: "northern", fi: "northern", fr: "western", de: "western", gr: "southern", hu: "central", ie: "western",
  it: "southern", lv: "northern", lt: "northern", lu: "western", mt: "southern", nl: "western", pl: "central",
  pt: "southern", ro: "central", sk: "central", si: "central", es: "southern", se: "northern", no: "northern",
  is: "northern", ch: "central", us: "namerica", ca: "namerica", au: "australia",
};

export function countryImage(code: string) {
  return REGIONS[BY_CODE[code] ?? "western"];
}
