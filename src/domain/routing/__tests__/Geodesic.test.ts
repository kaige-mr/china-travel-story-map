import { describe, it, expect } from 'vitest';
import { GeodesicCalculator } from '../Geodesic';

describe('Geodesic High-Precision Vincenty Ellipsoid', () => {
  const beijing = { lat: 39.9042, lng: 116.4074 };
  const shanghai = { lat: 31.2304, lng: 121.4737 };

  it('computes accurate distance between Beijing and Shanghai (~1068 km)', () => {
    const result = GeodesicCalculator.inverse(beijing, shanghai);
    const distKm = result.distanceMeters / 1000;

    expect(distKm).toBeGreaterThan(1060);
    expect(distKm).toBeLessThan(1085);
    expect(result.initialAzimuthDeg).toBeGreaterThan(140);
    expect(result.initialAzimuthDeg).toBeLessThan(160);
  });

  it('returns zero distance for identical coordinates', () => {
    const result = GeodesicCalculator.inverse(beijing, beijing);
    expect(result.distanceMeters).toBe(0);
  });

  it('calculates cross-track error to route', () => {
    const midpoint = { lat: 35.5, lng: 118.9 };
    const crossTrack = GeodesicCalculator.crossTrackDistance(midpoint, beijing, shanghai);
    expect(Math.abs(crossTrack)).toBeLessThan(50000); // within 50km of corridor
  });
});
