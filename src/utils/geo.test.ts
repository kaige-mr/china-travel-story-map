import { describe, it, expect } from 'vitest';
import { calculateHaversineDistance, clampCoordinates, computeBoundingBox } from './geo';

describe('Geographic Utilities', () => {
  it('calculates accurate distance between Beijing and Shanghai', () => {
    const beijing = { lat: 39.9042, lng: 116.4074 };
    const shanghai = { lat: 31.2304, lng: 121.4737 };
    const distance = calculateHaversineDistance(beijing, shanghai);
    expect(distance).toBeGreaterThan(1050);
    expect(distance).toBeLessThan(1100);
  });

  it('clamps out-of-bounds coordinates correctly', () => {
    expect(clampCoordinates({ lat: 95, lng: 200 })).toEqual({ lat: 90, lng: 180 });
    expect(clampCoordinates({ lat: -100, lng: -210 })).toEqual({ lat: -90, lng: -180 });
  });

  it('computes enclosing bounding box for travel route', () => {
    const points = [
      { lat: 30, lng: 100 },
      { lat: 40, lng: 120 },
      { lat: 25, lng: 110 }
    ];
    const bbox = computeBoundingBox(points);
    expect(bbox).toEqual({
      minLat: 25,
      maxLat: 40,
      minLng: 100,
      maxLng: 120
    });
  });
});
