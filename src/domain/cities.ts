import type { City } from "./story";

export const cities: City[] = [
  {
    id: "beijing",
    name: "Beijing",
    localName: "北京",
    province: "Beijing",
    lng: 116.4074,
    lat: 39.9042
  },
  {
    id: "xian",
    name: "Xi'an",
    localName: "西安",
    province: "Shaanxi",
    lng: 108.9398,
    lat: 34.3416
  },
  {
    id: "chengdu",
    name: "Chengdu",
    localName: "成都",
    province: "Sichuan",
    lng: 104.0665,
    lat: 30.5728
  },
  {
    id: "hangzhou",
    name: "Hangzhou",
    localName: "杭州",
    province: "Zhejiang",
    lng: 120.1551,
    lat: 30.2741
  },
  {
    id: "shanghai",
    name: "Shanghai",
    localName: "上海",
    province: "Shanghai",
    lng: 121.4737,
    lat: 31.2304
  },
  {
    id: "dali",
    name: "Dali",
    localName: "大理",
    province: "Yunnan",
    lng: 100.2676,
    lat: 25.6065
  },
  {
    id: "guilin",
    name: "Guilin",
    localName: "桂林",
    province: "Guangxi",
    lng: 110.2902,
    lat: 25.2736
  },
  {
    id: "lhasa",
    name: "Lhasa",
    localName: "拉萨",
    province: "Tibet",
    lng: 91.1172,
    lat: 29.6469
  },
  {
    id: "xiamen",
    name: "Xiamen",
    localName: "厦门",
    province: "Fujian",
    lng: 118.0894,
    lat: 24.4798
  },
  {
    id: "sanya",
    name: "Sanya",
    localName: "三亚",
    province: "Hainan",
    lng: 109.5119,
    lat: 18.2528
  },
  {
    id: "harbin",
    name: "Harbin",
    localName: "哈尔滨",
    province: "Heilongjiang",
    lng: 126.6424,
    lat: 45.756
  },
  {
    id: "urumqi",
    name: "Urumqi",
    localName: "乌鲁木齐",
    province: "Xinjiang",
    lng: 87.6168,
    lat: 43.8256
  }
];

export function findCity(cityId: string): City | undefined {
  return cities.find((city) => city.id === cityId);
}
