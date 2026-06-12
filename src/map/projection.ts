import type { City } from "../domain/story";
import {
  MAP_CAMERA,
  MAP_CANVAS_HEIGHT_RATIO,
  MAP_CANVAS_TOP_PERCENT,
  MAP_GROUP_POSITION,
  MAP_ROTATION_MATRIX,
  MAP_SURFACE_Z
} from "./mapScene";
import type { LngLat, LngLatBounds } from "./types";

export const CHINA_RENDER_BOUNDS: LngLatBounds = {
  minLng: 73.4,
  maxLng: 135.2,
  minLat: 17.6,
  maxLat: 53.7
};

export const CHINA_FULL_BOUNDS: LngLatBounds = {
  minLng: 73.498962,
  maxLng: 135.087387,
  minLat: 3.408477,
  maxLat: 53.558498
};

const WORLD_WIDTH = 6.5;
const WORLD_HEIGHT = 3.95;

export interface WorldPoint {
  x: number;
  y: number;
  z: number;
}

export interface PercentPoint {
  x: number;
  y: number;
}

export function projectLngLatToUnit(
  lng: number,
  lat: number,
  bounds: LngLatBounds = CHINA_RENDER_BOUNDS
): PercentPoint {
  return {
    x: (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng),
    y: (bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)
  };
}

export function projectLngLatToWorld(lng: number, lat: number): WorldPoint {
  const unit = projectLngLatToUnit(lng, lat);

  return {
    x: (unit.x - 0.5) * WORLD_WIDTH,
    y: (0.5 - unit.y) * WORLD_HEIGHT,
    z: 0
  };
}

export function projectRingToWorld(ring: LngLat[]): Array<[number, number]> {
  return ring.map(([lng, lat]) => {
    const point = projectLngLatToWorld(lng, lat);
    return [point.x, point.y];
  });
}

export function projectCityToStagePercent(city: Pick<City, "lng" | "lat">): PercentPoint {
  const unit = projectLngLatToUnit(city.lng, city.lat);

  return {
    x: 14 + unit.x * 72,
    y: 31 + unit.y * 48
  };
}

export function projectCityToTiltedStagePercent(city: Pick<City, "lng" | "lat">, aspect = 1.25): PercentPoint {
  const point = projectLngLatToWorld(city.lng, city.lat);
  const safeAspect = aspect > 0 ? aspect : 1.25;
  const worldPoint = {
    x: point.x,
    y: point.y,
    z: MAP_SURFACE_Z
  };
  const rotated = {
    x:
      MAP_ROTATION_MATRIX[0] * worldPoint.x +
      MAP_ROTATION_MATRIX[4] * worldPoint.y +
      MAP_ROTATION_MATRIX[8] * worldPoint.z +
      MAP_GROUP_POSITION.x,
    y:
      MAP_ROTATION_MATRIX[1] * worldPoint.x +
      MAP_ROTATION_MATRIX[5] * worldPoint.y +
      MAP_ROTATION_MATRIX[9] * worldPoint.z +
      MAP_GROUP_POSITION.y,
    z:
      MAP_ROTATION_MATRIX[2] * worldPoint.x +
      MAP_ROTATION_MATRIX[6] * worldPoint.y +
      MAP_ROTATION_MATRIX[10] * worldPoint.z +
      MAP_GROUP_POSITION.z
  };
  const viewZ = rotated.z - MAP_CAMERA.z;
  const focalLength = 1 / Math.tan((MAP_CAMERA.fov * Math.PI) / 360);
  const ndcX = (rotated.x * focalLength) / (safeAspect * -viewZ);
  const ndcY = (rotated.y * focalLength) / -viewZ;

  return {
    x: (ndcX + 1) * 50,
    y: (1 - ndcY) * 50
  };
}

export function projectCityToWebglStagePercent(
  city: Pick<City, "lng" | "lat">,
  stageAspect = 1.25
): PercentPoint {
  const canvasAspect = stageAspect / MAP_CANVAS_HEIGHT_RATIO;
  const canvasPoint = projectCityToTiltedStagePercent(city, canvasAspect);

  return {
    x: canvasPoint.x,
    y: MAP_CANVAS_TOP_PERCENT + canvasPoint.y * MAP_CANVAS_HEIGHT_RATIO
  };
}

export function clampToRenderBounds([lng, lat]: LngLat): LngLat {
  return [
    Math.max(CHINA_RENDER_BOUNDS.minLng, Math.min(CHINA_RENDER_BOUNDS.maxLng, lng)),
    Math.max(CHINA_RENDER_BOUNDS.minLat, Math.min(CHINA_RENDER_BOUNDS.maxLat, lat))
  ];
}
