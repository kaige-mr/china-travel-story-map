/**
 * Lightweight Pinyin prefix matcher for Chinese city search
 */

export interface CitySearchIndex {
  code: string;
  name: string;
  pinyinPrefix: string;
  province: string;
}

export function matchCity(city: CitySearchIndex, query: string): boolean {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    city.name.toLowerCase().includes(q) ||
    city.pinyinPrefix.toLowerCase().startsWith(q) ||
    city.province.toLowerCase().includes(q)
  );
}

export function filterCities(cities: CitySearchIndex[], query: string): CitySearchIndex[] {
  return cities.filter(c => matchCity(c, query));
}
