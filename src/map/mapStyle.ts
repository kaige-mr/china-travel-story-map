export interface ProvinceVisualStyle {
  color: string;
  emissive: string;
  highlightColor: string;
  roughness: number;
  metalness: number;
  emissiveIntensity: number;
  depth: number;
}

export interface BoundaryVisualStyle {
  lineColor: string;
  lineOpacity: number;
  lineZ: number;
  glowColor: string;
  glowOpacity: number;
  glowZ: number;
  contourColor: string;
  contourOpacity: number;
  contourZ: number;
  highlightOpacity: number;
  aquaColor: string;
  aquaOpacity: number;
  aquaZ: number;
  gradientColorTop: string;
  gradientColorBottom: string;
}

const WEST = new Set(["新疆维吾尔自治区", "西藏自治区", "青海省", "甘肃省"]);
const SOUTHWEST = new Set(["四川省", "云南省", "贵州省", "重庆市", "广西壮族自治区"]);
const COASTAL = new Set(["浙江省", "福建省", "广东省", "海南省", "台湾省", "上海市", "江苏省", "山东省", "天津市"]);
const NORTH = new Set(["北京市", "河北省", "山西省", "内蒙古自治区", "辽宁省", "吉林省", "黑龙江省"]);
const CENTRAL = new Set(["陕西省", "河南省", "湖北省", "湖南省", "江西省", "安徽省"]);

const REGION_STYLES: Record<string, ProvinceVisualStyle> = {
  west: {
    color: "#26343a",
    emissive: "#0b151a",
    highlightColor: "#ffd08a",
    roughness: 0.9,
    metalness: 0.24,
    emissiveIntensity: 0.13,
    depth: 0.2
  },
  southwest: {
    color: "#27363a",
    emissive: "#08171b",
    highlightColor: "#32e6ff",
    roughness: 0.84,
    metalness: 0.28,
    emissiveIntensity: 0.14,
    depth: 0.21
  },
  coastal: {
    color: "#283236",
    emissive: "#091418",
    highlightColor: "#ffd08a",
    roughness: 0.82,
    metalness: 0.3,
    emissiveIntensity: 0.13,
    depth: 0.19
  },
  north: {
    color: "#263039",
    emissive: "#081218",
    highlightColor: "#ffd08a",
    roughness: 0.88,
    metalness: 0.24,
    emissiveIntensity: 0.12,
    depth: 0.19
  },
  central: {
    color: "#303436",
    emissive: "#0d1514",
    highlightColor: "#ffd08a",
    roughness: 0.84,
    metalness: 0.28,
    emissiveIntensity: 0.13,
    depth: 0.2
  },
  default: {
    color: "#293135",
    emissive: "#091317",
    highlightColor: "#ffd08a",
    roughness: 0.86,
    metalness: 0.26,
    emissiveIntensity: 0.12,
    depth: 0.19
  }
};

const PROVINCE_STYLE_OVERRIDES: Record<string, Partial<ProvinceVisualStyle>> = {
  新疆维吾尔自治区: {
    color: "#25323b",
    emissive: "#09131a",
    highlightColor: "#ffd08a",
    roughness: 0.92,
    emissiveIntensity: 0.13
  },
  西藏自治区: {
    color: "#283840",
    emissive: "#0a151c",
    highlightColor: "#ffd08a",
    roughness: 0.93,
    emissiveIntensity: 0.13
  },
  青海省: {
    color: "#2c3a42",
    emissive: "#0b171e",
    highlightColor: "#ffd08a",
    roughness: 0.88,
    emissiveIntensity: 0.14
  },
  甘肃省: {
    color: "#34372c",
    emissive: "#151308",
    highlightColor: "#ffd08a",
    roughness: 0.86,
    emissiveIntensity: 0.14
  },
  四川省: {
    color: "#124550",
    emissive: "#043542",
    highlightColor: "#32e6ff",
    roughness: 0.78,
    metalness: 0.32,
    emissiveIntensity: 0.28
  },
  云南省: {
    color: "#16424a",
    emissive: "#042b36",
    highlightColor: "#32e6ff",
    roughness: 0.8,
    metalness: 0.3,
    emissiveIntensity: 0.24
  },
  浙江省: {
    color: "#2b3334",
    emissive: "#0d1312",
    highlightColor: "#ffd08a",
    roughness: 0.76,
    emissiveIntensity: 0.13
  },
  福建省: {
    color: "#283233",
    emissive: "#0c1312",
    highlightColor: "#ffd08a",
    roughness: 0.76,
    emissiveIntensity: 0.13
  },
  广东省: {
    color: "#293435",
    emissive: "#0c1413",
    highlightColor: "#ffd08a",
    roughness: 0.76,
    emissiveIntensity: 0.13
  },
  黑龙江省: {
    color: "#26313b",
    emissive: "#081218",
    highlightColor: "#ffd08a",
    roughness: 0.86,
    emissiveIntensity: 0.12
  }
};

function regionForProvince(provinceName: string): keyof typeof REGION_STYLES {
  if (WEST.has(provinceName)) return "west";
  if (SOUTHWEST.has(provinceName)) return "southwest";
  if (COASTAL.has(provinceName)) return "coastal";
  if (NORTH.has(provinceName)) return "north";
  if (CENTRAL.has(provinceName)) return "central";
  return "default";
}

export function getProvinceVisualStyle(provinceName: string, polygonIndex: number): ProvinceVisualStyle {
  const base = {
    ...REGION_STYLES[regionForProvince(provinceName)],
    ...PROVINCE_STYLE_OVERRIDES[provinceName]
  };
  const depthVariation = (polygonIndex % 4) * 0.006;

  return {
    ...base,
    depth: base.depth + depthVariation,
    emissiveIntensity: base.emissiveIntensity + (polygonIndex % 3) * 0.015
  };
}

export function getBoundaryVisualStyle(): BoundaryVisualStyle {
  return {
    lineColor: "#ffc46f",
    lineOpacity: 0.76,
    lineZ: 0.285,
    glowColor: "#ff9f35",
    glowOpacity: 0.42,
    glowZ: 0.286,
    contourColor: "#ffd08a",
    contourOpacity: 0.14,
    contourZ: 0.287,
    highlightOpacity: 0.13,
    aquaColor: "#32e6ff",
    aquaOpacity: 0.52,
    aquaZ: 0.292,
    gradientColorTop: "#00e5ff",
    gradientColorBottom: "#0055ff"
  };
}
