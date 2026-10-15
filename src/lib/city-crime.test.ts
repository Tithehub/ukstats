import { describe, it, expect } from 'vitest';
import { cityTopTens, parseCanadianCities } from './city-crime';
const fixture = (missing = false) => 'REF_DATE,GEO,DGUID,Statistics,VALUE,STATUS,UOM\n' + Array.from({length:25},(_,i) => `2025,"City ${i}, Province [${i}]",2021A0035${i},Crime severity index,${missing && i===0 ? '' : i},,Index`).join('\n');
describe('official city crime rankings', () => {
 it('shows exactly ten lowest and ten highest city values', () => { const data=parseCanadianCities(fixture());const lists=cityTopTens(data.rows);expect(data.period).toBe('2025');expect(lists.lowest.map(r=>r.value)).toEqual([0,1,2,3,4,5,6,7,8,9]);expect(lists.highest.map(r=>r.value)).toEqual([24,23,22,21,20,19,18,17,16,15]); });
 it('never ranks a partial latest-year table', () => { expect(parseCanadianCities(fixture(true)).rows).toEqual([]); });
 it('does not substitute national or provincial totals for cities', () => { const data=parseCanadianCities(fixture()+'\n2025,Canada,2021A000011124,Crime severity index,999,,Index'); expect(data.rows).toHaveLength(25); });
 it('does not mix years or pad short lists', () => {const data=parseCanadianCities(fixture()+'\n2026,New city,2021A003599,Crime severity index,10,,Index');expect(data.rows).toEqual([]);expect(cityTopTens(Array.from({length:19},(_,i)=>({name:String(i),code:String(i),value:i}))).lowest).toEqual([]);});
});