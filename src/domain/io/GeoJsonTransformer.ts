/**
 * RFC 7946 GeoJSON Transformer & FeatureCollection Validator
 * Serializes multi-stop travel stories into standardized GeoJSON formats with custom properties.
 */

export interface GeoJsonGeometry {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString';
  coordinates: number[] | number[][] | number[][][];
}

export interface GeoJsonFeature<P = Record<string, unknown>> {
  type: 'Feature';
  id?: string | number;
  properties: P;
  geometry: GeoJsonGeometry;
}

export interface GeoJsonFeatureCollection<P = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: GeoJsonFeature<P>[];
  bbox?: [number, number, number, number];
}

export interface StoryStopInput {
  id: string;
  name: string;
  province?: string;
  lat: number;
  lng: number;
  visitedDate?: string;
  notes?: string;
  photos?: string[];
}

export class GeoJsonTransformer {
  public static toFeatureCollection(stops: StoryStopInput[], routeName = 'Travel Route'): GeoJsonFeatureCollection {
    const features: GeoJsonFeature[] = [];

    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;

    // 1. Point features for stops
    for (const stop of stops) {
      if (stop.lng < minLng) minLng = stop.lng;
      if (stop.lat < minLat) minLat = stop.lat;
      if (stop.lng > maxLng) maxLng = stop.lng;
      if (stop.lat > maxLat) maxLat = stop.lat;

      features.push({
        type: 'Feature',
        id: stop.id,
        properties: {
          kind: 'stop',
          name: stop.name,
          province: stop.province ?? '',
          visitedDate: stop.visitedDate ?? '',
          notes: stop.notes ?? '',
          photosCount: stop.photos?.length ?? 0
        },
        geometry: {
          type: 'Point',
          coordinates: [stop.lng, stop.lat]
        }
      });
    }

    // 2. LineString feature for the connecting path
    if (stops.length >= 2) {
      features.push({
        type: 'Feature',
        properties: {
          kind: 'route',
          name: routeName,
          stopCount: stops.length
        },
        geometry: {
          type: 'LineString',
          coordinates: stops.map(s => [s.lng, s.lat])
        }
      });
    }

    const bbox: [number, number, number, number] | undefined =
      stops.length > 0 ? [minLng, minLat, maxLng, maxLat] : undefined;

    return {
      type: 'FeatureCollection',
      features,
      bbox
    };
  }

  public static validate(geoJson: unknown): boolean {
    if (!geoJson || typeof geoJson !== 'object') return false;
    const obj = geoJson as Record<string, unknown>;
    if (obj.type !== 'FeatureCollection') return false;
    if (!Array.isArray(obj.features)) return false;

    for (const feat of obj.features) {
      if (feat.type !== 'Feature') return false;
      if (!feat.geometry || typeof feat.geometry !== 'object') return false;
      if (!Array.isArray(feat.geometry.coordinates)) return false;
    }
    return true;
  }
}
