import { createFileRoute } from '@tanstack/react-router';
import { countryByCode } from '@/lib/countries';
import { countryHead } from '@/lib/country-detail';
import { cityCrimeQuery } from '@/lib/city-crime.functions';
import { CountryShell } from '@/components/CountryShell';
import { CityCrimeRankings } from '@/components/CityCrimeRankings';
import { PageLoadError, PageNotFound } from '@/components/layout/PageFeedback';
export const Route=createFileRoute('/$country/safest-places')({
 loader:({params,context})=>context.queryClient.ensureQueryData(cityCrimeQuery(params.country)),
 head:({params})=>countryHead(countryByCode(params.country)?.name ?? params.country,'City crime rankings','Lowest and highest recorded city crime, where official comparable local data is available. No invented safety scores.'),
 component:Page,errorComponent:PageLoadError,notFoundComponent:PageNotFound,
});
function Page(){const {country}=Route.useParams();const reg=countryByCode(country);if(!reg)return null;return <CountryShell country={reg}><CityCrimeRankings code={country}/></CountryShell>;}