import { describe, it, expect } from 'vitest';
import { cityTopTens, fbiLimitedDataStates, parseCanadianCities, parseFbiCities, parseUkCspRates, unassignedRecordedNames, type FbiCityRow, type UkCspRow } from './city-crime';
const fixture = (missing = false) => 'REF_DATE,GEO,DGUID,Statistics,VALUE,STATUS,UOM\n' + Array.from({length:25},(_,i) => `2025,"City ${i}, Province [${i}]",2021A0035${i},Crime severity index,${missing && i===0 ? '' : i},,Index`).join('\n');

const ukFixture = (n = 25): UkCspRow[] => Array.from({length:n},(_,i)=>({name:`Area ${i}`,code:`E220000${String(i).padStart(2,'0')}`,rawValue:String(20+i)}));

const fbiFixture = (): FbiCityRow[] => Array.from({length:25},(_,i)=>({state:'California',city:`City ${i}`,population:'100000',violent:String(100+i)}));

describe('official city crime rankings', () => {
 it('shows exactly ten lowest and ten highest city values', () => { const data=parseCanadianCities(fixture());const lists=cityTopTens(data.rows);expect(data.period).toBe('2025');expect(lists.lowest.map(r=>r.value)).toEqual([0,1,2,3,4,5,6,7,8,9]);expect(lists.highest.map(r=>r.value)).toEqual([24,23,22,21,20,19,18,17,16,15]); });
 it('never ranks a partial latest-year table', () => { expect(parseCanadianCities(fixture(true)).rows).toEqual([]); });
 it('does not substitute national or provincial totals for cities', () => { const data=parseCanadianCities(fixture()+'\n2025,Canada,2021A000011124,Crime severity index,999,,Index'); expect(data.rows).toHaveLength(25); });
 it('does not mix years or pad short lists', () => {const data=parseCanadianCities(fixture()+'\n2026,New city,2021A003599,Crime severity index,10,,Index');expect(data.rows).toEqual([]);expect(cityTopTens(Array.from({length:19},(_,i)=>({name:String(i),code:String(i),value:i}))).lowest).toEqual([]);});
});

describe('UK community safety partnership rankings', () => {
 it('extracts publisher-flagged unassigned areas from the notes', () => {
   expect(unassignedRecordedNames(['Due to ongoing IT issues, crime data for Maidstone, Medway, Tonbridge and Malling, Dartford and Gravesham, and Tunbridge Wells are recorded under an unassigned CSP group from 2024 onwards.'])).toEqual(['Maidstone','Medway','Tonbridge and Malling','Dartford and Gravesham','Tunbridge Wells']);
 });
 it('never ranks areas the publisher says are recorded under an unassigned group', () => {
   const rows = [...ukFixture(25), { name: 'Maidstone', code: 'E22000142', rawValue: '0.175' }];
   const parsed = parseUkCspRates(rows, { excluded: ['Maidstone'] });
   expect(parsed.reason).toBeNull();
   expect(parsed.rows.some(r => r.name === 'Maidstone')).toBe(false);
   expect(parsed.rows).toHaveLength(25);
 });
 it('blocks the whole ranking if a contradicting near-zero rate slips through', () => {
   const parsed = parseUkCspRates([...ukFixture(25), { name: 'Maidstone', code: 'E22000142', rawValue: '0.175' }]);
   expect(parsed.rows).toEqual([]);
   expect(parsed.reason).toContain('No ranking is shown');
 });
 it('skips areas the publisher marks as not presented and unassigned rows', () => {
   const parsed = parseUkCspRates([...ukFixture(25), { name: 'City of London', code: 'E22000180', rawValue: '[u1]' }, { name: 'Unassigned Kent', code: 'E22000099', rawValue: null }]);
   expect(parsed.reason).toBeNull();
   expect(parsed.rows).toHaveLength(25);
 });
 it('shows no ranking when the published table falls below twenty areas', () => {
   const parsed = parseUkCspRates(ukFixture(19));
   expect(parsed.rows).toHaveLength(19);
   expect(parsed.reason).toContain('Fewer than twenty');
 });
});

describe('FBI Table 8 city rankings', () => {
 it('ranks cities by violent crime per 100,000, exactly ten each way', () => {
   const parsed = parseFbiCities(fbiFixture());
   expect(parsed.reason).toBeNull();
   expect(cityTopTens(parsed.rows).lowest[0]!.name).toBe('City 0, California');
   expect(cityTopTens(parsed.rows).highest[0]!.name).toBe('City 24, California');
   expect(cityTopTens(parsed.rows).lowest[0]!.value).toBeCloseTo(100.0, 1);
 });
 it('leaves out states the FBI footnotes as having limited data', () => {
   const states = fbiLimitedDataStates(['2 Limited data for 2025 were available for Florida and North Dakota.']);
   expect(states).toEqual(['Florida', 'North Dakota']);
   const parsed = parseFbiCities([...fbiFixture(), { state: 'Florida', city: 'Tallahassee', population: '200000', violent: '2' }], { excludedStates: states });
   expect(parsed.rows.length).toBe(25);
   expect(parsed.rows.some(r => r.name.includes('Tallahassee'))).toBe(false);
 });
 it('never ranks cities below the 10,000 population floor', () => {
   const parsed = parseFbiCities([...fbiFixture(), { state: 'California', city: 'Tiny Ville', population: '900', violent: '40' }]);
   expect(parsed.rows.some(r => r.name.includes('Tiny Ville'))).toBe(false);
 });
 it('blocks the whole ranking when a city figure is missing', () => {
   const parsed = parseFbiCities([...fbiFixture(), { state: 'California', city: 'Broken', population: null, violent: '10' }]);
   expect(parsed.rows).toEqual([]);
   expect(parsed.reason).toContain('No partial ranking');
 });
});