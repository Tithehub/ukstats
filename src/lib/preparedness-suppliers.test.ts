import { describe, expect, it } from 'vitest';
import { PREPAREDNESS_SUPPLIERS, SUPPLIER_LINK_POLICY } from './preparedness-suppliers';

describe('non-commercial emergency supplier links', () => {
  it('earns no commission or paid-placement income', () => {
    expect(SUPPLIER_LINK_POLICY.commissionEarned).toBe(false);
    expect(SUPPLIER_LINK_POLICY.paidPlacement).toBe(false);
  });
  it('does not endorse suppliers or products', () => {
    expect(SUPPLIER_LINK_POLICY.endorsed).toBe(false);
  });
  it('uses direct supplier URLs without affiliate or tracking parameters', () => {
    expect(SUPPLIER_LINK_POLICY.affiliateLinks).toBe(false);
    expect(PREPAREDNESS_SUPPLIERS.length).toBe(3);
    for (const supplier of PREPAREDNESS_SUPPLIERS) {
      const url = new URL(supplier.url);
      expect(url.protocol).toBe('https:');
      expect(['evaq8.co.uk', 'shop.countrywidehealthcare.co.uk']).toContain(url.hostname);
      expect(url.search).toBe('');
      expect(url.hash).toBe('');
    }
  });
  it('keeps any purchase with the external supplier', () => {
    expect(SUPPLIER_LINK_POLICY.checkout).toBe('supplier');
  });
});