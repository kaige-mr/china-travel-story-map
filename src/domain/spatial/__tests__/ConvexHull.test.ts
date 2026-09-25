import { describe, it, expect } from 'vitest';
import {
  computeConvexHull,
  computePolygonArea,
  computePolygonPerimeter,
  computePolygonCentroid,
  isPointInsidePolygon,
  HullPoint
} from '../ConvexHull';

describe('ConvexHull Graham Scan & Polygon Metrics', () => {
  const squarePoints: HullPoint[] = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
    { x: 5, y: 5 }, // interior point
    { x: 2, y: 3 }  // interior point
  ];

  it('extracts extreme boundary points and excludes interior points', () => {
    const hull = computeConvexHull(squarePoints);
    expect(hull.length).toBe(4);
    expect(hull.some(p => p.x === 5 && p.y === 5)).toBe(false);
  });

  it('computes polygon surface area via Shoelace formula', () => {
    const square: HullPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 }
    ];
    expect(computePolygonArea(square)).toBe(100);
  });

  it('computes polygon perimeter', () => {
    const square: HullPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 }
    ];
    expect(computePolygonPerimeter(square)).toBe(40);
  });

  it('computes geometric centroid of polygon', () => {
    const square: HullPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 }
    ];
    const centroid = computePolygonCentroid(square);
    expect(centroid.x).toBeCloseTo(5, 4);
    expect(centroid.y).toBeCloseTo(5, 4);
  });

  it('determines point-in-polygon containment accurately', () => {
    const poly: HullPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 }
    ];

    expect(isPointInsidePolygon({ x: 5, y: 5 }, poly)).toBe(true);
    expect(isPointInsidePolygon({ x: 15, y: 5 }, poly)).toBe(false);
    expect(isPointInsidePolygon({ x: -1, y: -1 }, poly)).toBe(false);
  });
});
