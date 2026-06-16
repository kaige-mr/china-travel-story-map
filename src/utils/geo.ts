/**
 * Geographic projection and distance calculation utilities
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates great-circle distance between two points using Haversine formula
 */
export function calculateHaversineDistance(p1: LatLng, p2: LatLng): number {
  const dLat = toRadians(p2.lat - p1.lat);
  const dLng = toRadians(p2.lng - p1.lng);
  const lat1 = toRadians(p1.lat);
  const lat2 = toRadians(p2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_KM * c * 100) / 100;
}

/**
 * Clamps coordinates within valid geographic bounds
 */
export function clampCoordinates(coord: LatLng): LatLng {
  return {
    lat: Math.max(-90, Math.min(90, coord.lat)),
    lng: Math.max(-180, Math.min(180, coord.lng))
  };
}

/**
 * Computes the minimum bounding box encompassing all points
 */
export function computeBoundingBox(points: LatLng[]): BoundingBox | null {
  if (!points || points.length === 0) return null;

  return points.reduce(
    (acc, p) => ({
      minLat: Math.min(acc.minLat, p.lat),
      maxLat: Math.max(acc.maxLat, p.lat),
      minLng: Math.min(acc.minLng, p.lng),
      maxLng: Math.max(acc.maxLng, p.lng)
    }),
    {
      minLat: points[0].lat,
      maxLat: points[0].lat,
      minLng: points[0].lng,
      maxLng: points[0].lng
    }
  );
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}
