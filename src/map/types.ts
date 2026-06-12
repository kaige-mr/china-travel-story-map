export type LngLat = [number, number];

export interface ChinaGeoProperties {
  name: string;
  gb?: string;
  code?: string;
  filename?: string;
}

export interface ChinaPolygonGeometry {
  type: "Polygon";
  coordinates: LngLat[][]; // rings
}

export interface ChinaMultiPolygonGeometry {
  type: "MultiPolygon";
  coordinates: LngLat[][][]; // polygons -> rings
}

export interface ChinaMultiLineStringGeometry {
  type: "MultiLineString";
  coordinates: LngLat[][]; // lines
}

export type ChinaGeometry =
  | ChinaPolygonGeometry
  | ChinaMultiPolygonGeometry
  | ChinaMultiLineStringGeometry;

export interface ChinaFeature {
  type: "Feature";
  properties: ChinaGeoProperties;
  geometry: ChinaGeometry;
}

export interface ChinaFeatureCollection {
  type: "FeatureCollection";
  features: ChinaFeature[];
}

export interface LngLatBounds {
  minLng: number;
  maxLng: number;
  minLat: number;
  maxLat: number;
}

export interface RenderablePolygon {
  featureName: string;
  rings: LngLat[][];
}
