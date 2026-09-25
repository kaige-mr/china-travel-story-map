import { describe, it, expect } from 'vitest';
import { GpxHandler, GpxTrackPoint } from '../GpxHandler';

describe('GpxHandler GPX 1.1 Serialization & Parsing', () => {
  const points: GpxTrackPoint[] = [
    { lat: 39.9042, lng: 116.4074, ele: 43.5, name: 'Forbidden City', time: '2026-05-01T08:00:00Z' },
    { lat: 31.2304, lng: 121.4737, ele: 12.0, name: 'The Bund', time: '2026-05-03T14:30:00Z' }
  ];

  it('serializes trackpoints to valid GPX XML string', () => {
    const xml = GpxHandler.serialize(points, {
      name: 'China Heritage Trip',
      author: 'Travel Explorer'
    });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<name>China Heritage Trip</name>');
    expect(xml).toContain('<trkpt lat="39.904200" lon="116.407400">');
    expect(xml).toContain('<ele>43.5</ele>');
  });

  it('roundtrips parsing of serialized GPX content', () => {
    const xml = GpxHandler.serialize(points, { name: 'Test Trip' });
    const parsed = GpxHandler.parse(xml);

    expect(parsed.points.length).toBe(2);
    expect(parsed.points[0].lat).toBeCloseTo(39.9042, 4);
    expect(parsed.points[0].lng).toBeCloseTo(116.4074, 4);
    expect(parsed.points[0].ele).toBe(43.5);
  });
});
