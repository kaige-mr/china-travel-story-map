import fs from 'fs';
import https from 'https';
import { pinyin } from 'pinyin-pro';

const URL = 'https://geo.datav.aliyun.com/areas_v3/bound/infos.json';

https.get(URL, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body);
    
    const provinces = Object.values(data).filter(item => item.level === 'province');
    const cities = [];
    
    const formatName = (zhName) => {
      return pinyin(zhName, { toneType: 'none', type: 'string', v: true })
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
    };

    for (const prov of provinces) {
      const provAdcode = prov.adcode;
      let cleanProvName = prov.name;
      if (cleanProvName.endsWith('省') || cleanProvName.endsWith('市')) {
        cleanProvName = cleanProvName.slice(0, -1);
      }
      if (cleanProvName.endsWith('特别行政区')) {
        cleanProvName = cleanProvName.slice(0, -5);
      }
      if (cleanProvName.endsWith('自治区')) {
        cleanProvName = cleanProvName.replace(/自治区$/, '');
      }
      const provNameEn = formatName(cleanProvName);
      
      const children = Object.values(data).filter(item => item.parent && item.parent.adcode === provAdcode);
      const cityChildren = children.filter(c => c.level === 'city');
      
      if (cityChildren.length > 0) {
        for (const city of cityChildren) {
          let cleanCityName = city.name;
          let enName = formatName(cleanCityName.replace(/(市|区|县|自治州|地区|盟)$/, ''));

          cities.push({
            id: city.adcode.toString(),
            name: enName,
            localName: city.name,
            province: prov.name,
            lng: city.center ? city.center[0] : (city.centroid ? city.centroid[0] : 0),
            lat: city.center ? city.center[1] : (city.centroid ? city.centroid[1] : 0),
          });
        }
      } else {
        // No city-level children (Municipalities, HK, Macau, Taiwan). We treat the province itself as the city.
        cities.push({
          id: prov.adcode.toString(),
          name: provNameEn,
          localName: prov.name,
          province: prov.name,
          lng: prov.center ? prov.center[0] : (prov.centroid ? prov.centroid[0] : 0),
          lat: prov.center ? prov.center[1] : (prov.centroid ? prov.centroid[1] : 0),
        });
      }
    }
    
    const validCities = cities.filter(c => c.lng !== 0 && c.lat !== 0 && !c.localName.includes('直辖县级行政区'));
    validCities.sort((a, b) => a.province.localeCompare(b.province, 'zh-CN'));
    
    const tsContent = `import type { City } from "./story";

export const cities: City[] = ${JSON.stringify(validCities, null, 2)};

export function findCity(cityId: string): City | undefined {
  return cities.find((city) => city.id === cityId);
}
`;
    
    fs.writeFileSync('src/domain/cities.ts', tsContent, 'utf-8');
    console.log(`Generated ${validCities.length} cities in src/domain/cities.ts`);
  });
}).on('error', (e) => {
  console.error(e);
});
