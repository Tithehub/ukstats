import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
export const getCountryStats = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ code: z.string().regex(/^[a-z]{2}$/) }))
  .handler(async ({ data }) => { const { loadCountryStats } = await import('./countries.server'); return loadCountryStats(data.code); });
export const getCountryHistory = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ code: z.string().regex(/^[a-z]{2}$/), id: z.string().min(1).max(100) }))
  .handler(async ({ data }) => { const { loadCountryHistory } = await import('./countries.server'); return loadCountryHistory(data.code, data.id); });
export const getComparison = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ metric: z.string().max(100) }))
  .handler(async ({ data }) => { const { loadComparison } = await import('./countries.server'); return loadComparison(data.metric); });
