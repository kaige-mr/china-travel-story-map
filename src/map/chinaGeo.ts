import type {
  ChinaFeature,
  ChinaFeatureCollection,
  LngLat,
  LngLatBounds,
  RenderablePolygon
} from "./types";
import { CHINA_RENDER_BOUNDS } from "./projection";

const MAIN_MAP_LAT_BUFFER = 0.6;

export function getFeaturePolygons(feature: ChinaFeature): RenderablePolygon[] {
  if (feature.geometry.type === "Polygon") {
    return [{ featureName: feature.properties.name, rings: feature.geometry.coordinates }];
  }

  if (feature.geometry.type === "MultiPolygon") {
    return feature.geometry.coordinates.map((rings) => ({
      featureName: feature.properties.name,
      rings
    }));
  }

  return [];
}

export function getRenderablePolygons(geo: ChinaFeatureCollection): RenderablePolygon[] {
  return geo.features.flatMap(getFeaturePolygons);
}

export function getRingBounds(ring: LngLat[]): LngLatBounds {
  const bounds: LngLatBounds = {
    minLng: Number.POSITIVE_INFINITY,
    maxLng: Number.NEGATIVE_INFINITY,
    minLat: Number.POSITIVE_INFINITY,
    maxLat: Number.NEGATIVE_INFINITY
  };

  ring.forEach(([lng, lat]) => {
    bounds.minLng = Math.min(bounds.minLng, lng);
    bounds.maxLng = Math.max(bounds.maxLng, lng);
    bounds.minLat = Math.min(bounds.minLat, lat);
    bounds.maxLat = Math.max(bounds.maxLat, lat);
  });

  return bounds;
}

export function isMainMapRing(ring: LngLat[]): boolean {
  if (ring.length < 2) {
    return false;
  }

  const bounds = getRingBounds(ring);

  return (
    bounds.minLat >= CHINA_RENDER_BOUNDS.minLat - MAIN_MAP_LAT_BUFFER &&
    bounds.maxLat <= CHINA_RENDER_BOUNDS.maxLat + MAIN_MAP_LAT_BUFFER &&
    bounds.maxLng >= CHINA_RENDER_BOUNDS.minLng &&
    bounds.minLng <= CHINA_RENDER_BOUNDS.maxLng
  );
}

export function getMainMapPolygons(geo: ChinaFeatureCollection): RenderablePolygon[] {
  return getRenderablePolygons(geo).filter((polygon) => polygon.rings[0] && isMainMapRing(polygon.rings[0]));
}

export function getProvinceBoundarySegments(geo: ChinaFeatureCollection): LngLat[][] {
  const featureSegments = geo.features.flatMap((feature) => {
    if (feature.geometry.type === "MultiLineString") {
      return feature.geometry.coordinates;
    }

    return getFeaturePolygons(feature).flatMap((polygon) => polygon.rings);
  });

  return featureSegments.filter((segment) => segment.length > 1);
}

export function getMainMapBoundarySegments(geo: ChinaFeatureCollection): LngLat[][] {
  return getProvinceBoundarySegments(geo).filter(isMainMapRing);
}

export function getSouthChinaSeaSegments(geo: ChinaFeatureCollection): LngLat[][] {
  return getProvinceBoundarySegments(geo).filter((segment) => {
    const bounds = getRingBounds(segment);
    return bounds.minLat < CHINA_RENDER_BOUNDS.minLat && bounds.maxLat > 3;
  });
}

export function getChinaBounds(geo: ChinaFeatureCollection): LngLatBounds {
  const bounds: LngLatBounds = {
    minLng: Number.POSITIVE_INFINITY,
    maxLng: Number.NEGATIVE_INFINITY,
    minLat: Number.POSITIVE_INFINITY,
    maxLat: Number.NEGATIVE_INFINITY
  };

  const visitPoint = ([lng, lat]: LngLat) => {
    bounds.minLng = Math.min(bounds.minLng, lng);
    bounds.maxLng = Math.max(bounds.maxLng, lng);
    bounds.minLat = Math.min(bounds.minLat, lat);
    bounds.maxLat = Math.max(bounds.maxLat, lat);
  };

  geo.features.forEach((feature) => {
    if (feature.geometry.type === "MultiLineString") {
      feature.geometry.coordinates.forEach((line) => line.forEach(visitPoint));
      return;
    }

    getFeaturePolygons(feature).forEach((polygon) => {
      polygon.rings.forEach((ring) => ring.forEach(visitPoint));
    });
  });

  return bounds;
}
