/** Dated supplier-page descriptions, not tested products or a retail integration. */
export const SUPPLIER_LINK_POLICY = {
  affiliateLinks: false,
  commissionEarned: false,
  paidPlacement: false,
  endorsed: false,
  checkout: 'supplier',
} as const;

export const SUPPLIER_LINKS_CHECKED = '2026-11-03T22:28:00Z';

export const PREPAREDNESS_SUPPLIERS = [
  {
    id: 'evaq8-starter',
    supplier: 'EVAQ8',
    name: 'GoBag Emergency Kit 72hr Survival Supplies',
    category: 'Individual starter bag',
    url: 'https://evaq8.co.uk/Home-Emergency-Kits/go-bag-emergency-kit-72-hour-survival-supplies.html',
    contents: ['Wind-up torch and light sticks', 'Compact first-aid kit, foil blanket and sleeping bag', 'Power bank, food ration, 500ml water ration and purification tablets'],
    limitations: 'Supplier describes this as a starter kit with room for personal supplies. No radio is listed. The included 500ml of water is far below the Be Ready drinking-water plan of 9 litres per person over three days.',
  },
  {
    id: 'evaq8-two-person',
    supplier: 'EVAQ8',
    name: 'GoBag Emergency Kit 2 Person',
    category: 'Two-person evacuation bag',
    url: 'https://evaq8.co.uk/Home-Emergency-Kits/gobag-emergency-kit-2-person.html',
    contents: ['Wind-up torch, light sticks and power bank', 'First-aid kit, two foil blankets and two emergency sleeping bags', 'Two food rations, two water rations and purification tablets'],
    limitations: 'Supplier lists 500ml of drinking water per person, not a complete three-day water supply. No radio is listed. Add appropriate food, drinking water, medication and personal requirements separately.',
  },
  {
    id: 'countrywide-evacuation',
    supplier: 'Countrywide Healthcare',
    name: 'Emergency Evacuation Grab Bag – EACH',
    category: 'Group evacuation starter bag',
    url: 'https://shop.countrywidehealthcare.co.uk/emergency-evacuation-grab-bag-each',
    contents: ['Wind-up torch, head torch and batteries', 'Travel first-aid kit and 20 foil blankets', 'Two high-visibility vests, whistle and ID wristbands'],
    limitations: 'A group evacuation starter bag, not a complete household kit. No food, drinking water or radio is listed. Supplier pricing requires login; confirm whether ordering is suitable for you.',
  },
] as const;