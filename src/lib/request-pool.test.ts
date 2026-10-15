import { expect, it } from 'vitest';
import { createRequestPool } from './request-pool';

it('caps active requests and releases slots after failures', async () => {
  const run = createRequestPool(4);
  let active = 0;
  let peak = 0;
  const results = await Promise.allSettled(Array.from({ length: 12 }, (_, index) => run(async () => {
    active++; peak = Math.max(peak, active);
    await new Promise(resolve => setTimeout(resolve, 2));
    active--;
    if (index === 3) throw new Error('publisher unavailable');
    return index;
  })));
  expect(peak).toBe(4);
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(11);
  expect(await run(async () => 'next')).toBe('next');
});