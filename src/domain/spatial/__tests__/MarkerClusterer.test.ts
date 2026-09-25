import { describe, it, expect } from 'vitest';
import { MarkerClusterer, GeoPoint } from '../MarkerClusterer';

describe('MarkerClusterer Multi-Resolution Engine', () => {
  const points: GeoPoint[] = [
    { id: 'bj1', lat: 39.9042, lng: 116.4074, title: 'Beijing Center' },
    { id: 'bj2', lat: 39.9200, lng: 116.4200, title: 'Beijing East' },
    { id: 'sh1', lat: 31.2304, lng: 121.4737, title: 'Shanghai Center' },
    { id: 'sh2', lat: 31.2400, lng: 121.4800, title: 'Shanghai Bund' },
    { id: 'gz1', lat: 23.1291, lng: 113.2644, title: 'Guangzhou' }
  ];

  it('aggregates nearby points at low zoom levels', () => {
    const clusterer = new MarkerClusterer(points, { maxZoom: 16 });
    const clusters = clusterer.getClusters(4);

    expect(clusters.length).toBeLessThan(points.length);
    const beijingCluster = clusters.find(c => c.points.some(p => p.id === 'bj1'));
    expect(beijingCluster).toBeDefined();
    expect(beijingCluster?.count).toBeGreaterThanOrEqual(2);
  });

  it('expands clusters to discrete single points at max zoom', () => {
    const clusterer = new MarkerClusterer(points, { maxZoom: 16 });
    const clusters = clusterer.getClusters(17);

    expect(clusters.length).toBe(points.length);
    clusters.forEach(c => expect(c.count).toBe(1));
  });

  it('computes weighted geographic centroids', () => {
    const clusterer = new MarkerClusterer([
      { id: 'a', lat: 30, lng: 100 },
      { id: 'b', lat: 32, lng: 102 }
    ], { radiusKm: 500 });

    const clusters = clusterer.getClusters(2);
    expect(clusters.length).toBe(1);
    expect(clusters[0].lat).toBeCloseTo(31, 2);
    expect(clusters[0].lng).toBeCloseTo(101, 2);
  });

  it('caches cluster computations per zoom level', () => {
    const clusterer = new MarkerClusterer(points);
    const first = clusterer.getClusters(6);
    const second = clusterer.getClusters(6);
    expect(first).toBe(second);
  });
});
