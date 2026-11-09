/**
 * Licensed racing data provider adapter. Each provider (The Racing API, Weatherbys, BHA, an odds provider)
 * implements this in its own file; nothing else in the app names a provider. Keys come from server secrets.
 * Never scrape sites or store data the licence does not allow.
 */
export interface ProviderMeeting { id: string; course: { id: string; name: string; surface?: string }; date: string; going?: string }
export interface ProviderRunner {
  id: string; horse: { id: string; name: string; sex?: string; foaled?: string; sire?: string; dam?: string };
  trainer?: { id: string; name: string }; jockey?: { id: string; name: string };
  cloth?: number; draw?: number; age?: number; weightLbs?: number; rating?: number; form?: string; headgear?: string; nonRunner?: boolean;
}
export interface ProviderRace { id: string; meetingId: string; off: string; name: string; type?: string; distanceYards?: number; class?: string; prizeGbp?: number; going?: string; status?: string; runners: ProviderRunner[] }
export interface ProviderOdds { raceId: string; horseId: string; bookmaker: string; decimal: number; at: string }
export interface ProviderResult { raceId: string; horseId: string; position: number | null; status: string; spDecimal?: number }

export interface RacingProvider {
  id: string;
  name: string;
  /** True only when its secret is set. */
  configured(): boolean;
  racecards?(date: string): Promise<{ meetings: ProviderMeeting[]; races: ProviderRace[] }>;
  odds?(raceId: string): Promise<ProviderOdds[]>;
  results?(date: string): Promise<ProviderResult[]>;
}

/** Registry: providers are added here once a licence and key exist. Empty until then. */
export const PROVIDERS: RacingProvider[] = [];

/** True while no licensed provider is registered: pages show clearly labelled EXAMPLE data. */
export const RACING_DEMO = PROVIDERS.length === 0;
