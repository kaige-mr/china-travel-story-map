import { describe, it, expect } from 'vitest';
import { DelaunayTriangulator, Vector2D } from '../DelaunayTriangulation';

describe('DelaunayTriangulation & Minimum Spanning Tree', () => {
  const points: Vector2D[] = [
    { x: 0, y: 0, id: 'A' },
    { x: 10, y: 0, id: 'B' },
    { x: 10, y: 10, id: 'C' },
    { x: 0, y: 10, id: 'D' }
  ];

  it('triangulates 4 points into 2 planar triangles', () => {
    const triangles = DelaunayTriangulator.triangulate(points);
    expect(triangles.length).toBe(2);
  });

  it('returns empty array when fewer than 3 points', () => {
    expect(DelaunayTriangulator.triangulate([])).toEqual([]);
    expect(DelaunayTriangulator.triangulate([{ x: 1, y: 1 }])).toEqual([]);
  });

  it('extracts unique edges with euclidean weights', () => {
    const triangles = DelaunayTriangulator.triangulate(points);
    const edges = DelaunayTriangulator.extractUniqueEdges(triangles);
    expect(edges.length).toBe(5); // 4 outer edges + 1 diagonal
    edges.forEach(e => expect(e.weight).toBeGreaterThan(0));
  });

  it('computes Minimum Spanning Tree connecting all vertices', () => {
    const mst = DelaunayTriangulator.computeMinimumSpanningTree(points);
    expect(mst.length).toBe(points.length - 1);
  });
});
