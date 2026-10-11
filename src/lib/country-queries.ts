import { queryOptions } from '@tanstack/react-query';
import { getCountryStats, getCountryHistory } from './countries.functions';
export const countryQuery = (code: string) => queryOptions({ queryKey: ['country', code], queryFn: () => getCountryStats({ data: { code } }), staleTime: 10 * 60_000 });
export const countryHistoryQuery = (code: string, id: string) => queryOptions({ queryKey: ['country-history', code, id], queryFn: () => getCountryHistory({ data: { code, id } }), staleTime: 30 * 60_000 });
