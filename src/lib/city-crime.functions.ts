import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { queryOptions } from '@tanstack/react-query';
import { CRIME_COUNTRIES } from './city-crime';
export const getCityCrime = createServerFn({ method: 'POST' }).inputValidator(z.object({code:z.string().refine(code=>CRIME_COUNTRIES.some(c=>c.code===code))})).handler(async ({data})=>{
 const {loadCityCrime}=await import('./city-crime.server');return loadCityCrime(data.code);
});
export const cityCrimeQuery = (code: string) => queryOptions({queryKey:['city-crime',code],queryFn:()=>getCityCrime({data:{code}}),staleTime:6*60*60_000});