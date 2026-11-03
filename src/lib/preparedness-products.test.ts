import { describe, expect, it } from 'vitest';
import { PREPAREDNESS_PRODUCTS } from './preparedness-products';

describe('provisional preparedness catalogue', () => {
  it('uses the requested provisional prices', () => {
    expect(PREPAREDNESS_PRODUCTS.map(p => [p.id, p.pricePence])).toEqual([
      ['essential', 5999], ['household', 9999], ['family', 15999],
    ]);
  });
  it('targets one, two and four people respectively', () => {
    expect(PREPAREDNESS_PRODUCTS.map(p => p.householdSize)).toEqual([1, 2, 4]);
  });
  it('never includes food or drinking water in equipment packages', () => {
    for (const p of PREPAREDNESS_PRODUCTS) {
      expect(p.includesFood).toBe(false);
      expect(p.includesDrinkingWater).toBe(false);
    }
  });
  it('keeps all specifications provisional until supplier confirmation', () => {
    expect(PREPAREDNESS_PRODUCTS.map(p => p.status)).toEqual(['provisional', 'provisional', 'provisional']);
  });
});