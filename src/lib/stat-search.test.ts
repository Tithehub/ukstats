import { describe, expect, it } from 'vitest';
import { matchesMetric } from './stat-search';

describe('finding official figures', () => {
  const metric = { title: 'UK public sector net debt', source: 'ONS', category: 'Finance' as const, subcategory: null };
  it('finds a figure by title or publisher without case sensitivity', () => {
    expect(matchesMetric(metric, 'DEBT ons')).toBe(true);
    expect(matchesMetric(metric, 'housing')).toBe(false);
  });
  it('shows all figures for an empty search', () => {
    expect(matchesMetric(metric, '  ')).toBe(true);
  });
});