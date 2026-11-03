/** Proposed catalogue only: no supplier inventory or purchasing integration is confirmed. */
export type PreparednessProduct = {
  id: string;
  name: string;
  pricePence: number;
  householdSize: number;
  description: string;
  contents: string[];
  status: 'provisional';
  includesFood: false;
  includesDrinkingWater: false;
};

export const PREPAREDNESS_PRODUCTS: PreparednessProduct[] = [
  { id: 'essential', name: 'Essential Kit', pricePence: 5999, householdSize: 1,
    description: 'A practical starting point for individual preparedness.',
    contents: ['LED torch', 'Portable power bank', 'Battery supply', 'Compact first-aid kit', 'Emergency foil blankets', 'Basic hygiene supplies', 'Waterproof document pouch', 'Household preparedness checklist'],
    status: 'provisional', includesFood: false, includesDrinkingWater: false },
  { id: 'household', name: 'Household Kit', pricePence: 9999, householdSize: 2,
    description: 'Shared essentials designed for a typical two-person household.',
    contents: ['Larger portable power bank', 'Emergency lighting', 'Battery-powered or wind-up radio', 'First-aid supplies', 'Emergency blankets', 'Hygiene supplies', 'Waterproof document storage', 'Household emergency information cards'],
    status: 'provisional', includesFood: false, includesDrinkingWater: false },
  { id: 'family', name: 'Family Kit', pricePence: 15999, householdSize: 4,
    description: 'A larger shared equipment package designed around a four-person household.',
    contents: ['Emergency radio', 'Multiple lighting options', 'Portable charging equipment', 'Expanded first-aid supplies', 'Multiple emergency blankets', 'Hygiene supplies', 'Household document storage', 'Family preparedness information pack'],
    status: 'provisional', includesFood: false, includesDrinkingWater: false },
];