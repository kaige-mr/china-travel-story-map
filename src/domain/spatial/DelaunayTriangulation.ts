/**
 * Bowyer-Watson Delaunay Triangulation & Network Connectivity Mesh
 * Transforms scattered travel locations into a planar geometric network mesh.
 * Derives Minimum Spanning Tree (MST) for optimal regional route connections.
 */

export interface Vector2D {
  x: number;
  y: number;
  id?: string;
}

export interface Triangle {
  a: Vector2D;
  b: Vector2D;
  c: Vector2D;
}

export interface Edge {
  u: Vector2D;
  v: Vector2D;
  weight?: number;
}

export function edgeEquals(e1: Edge, e2: Edge): boolean {
  return (
    (pointsEqual(e1.u, e2.u) && pointsEqual(e1.v, e2.v)) ||
    (pointsEqual(e1.u, e2.v) && pointsEqual(e1.v, e2.u))
  );
}

export function pointsEqual(p1: Vector2D, p2: Vector2D): boolean {
  return Math.abs(p1.x - p2.x) < 1e-9 && Math.abs(p1.y - p2.y) < 1e-9;
}

export function circumcircleContains(tri: Triangle, p: Vector2D): boolean {
  const ax = tri.a.x - p.x;
  const ay = tri.a.y - p.y;
  const bx = tri.b.x - p.x;
  const by = tri.b.y - p.y;
  const cx = tri.c.x - p.x;
  const cy = tri.c.y - p.y;

  const det =
    (ax * ax + ay * ay) * (bx * cy - cx * by) -
    (bx * bx + by * by) * (ax * cy - cx * ay) +
    (cx * cx + cy * cy) * (ax * by - bx * ay);

  return det > 1e-9;
}

export class DelaunayTriangulator {
  public static triangulate(points: Vector2D[]): Triangle[] {
    if (points.length < 3) return [];

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const dx = maxX - minX;
    const dy = maxY - minY;
    const deltaMax = Math.max(dx, dy) * 2;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const superTriangle: Triangle = {
      a: { x: midX - 2 * deltaMax, y: midY - deltaMax },
      b: { x: midX, y: midY + 2 * deltaMax },
      c: { x: midX + 2 * deltaMax, y: midY - deltaMax }
    };

    let triangulation: Triangle[] = [superTriangle];

    for (const p of points) {
      const badTriangles: Triangle[] = [];

      for (const tri of triangulation) {
        if (circumcircleContains(tri, p)) {
          badTriangles.push(tri);
        }
      }

      const polygonEdges: Edge[] = [];
      for (const tri of badTriangles) {
        const edges: Edge[] = [
          { u: tri.a, v: tri.b },
          { u: tri.b, v: tri.c },
          { u: tri.c, v: tri.a }
        ];

        for (const edge of edges) {
          let shared = false;
          for (const otherTri of badTriangles) {
            if (otherTri === tri) continue;
            const otherEdges: Edge[] = [
              { u: otherTri.a, v: otherTri.b },
              { u: otherTri.b, v: otherTri.c },
              { u: otherTri.c, v: otherTri.a }
            ];
            if (otherEdges.some(oe => edgeEquals(oe, edge))) {
              shared = true;
              break;
            }
          }
          if (!shared) {
            polygonEdges.push(edge);
          }
        }
      }

      triangulation = triangulation.filter(t => !badTriangles.includes(t));

      for (const edge of polygonEdges) {
        triangulation.push({ a: edge.u, b: edge.v, c: p });
      }
    }

    // Remove triangles sharing vertices with the super triangle
    const isSuperVertex = (v: Vector2D) =>
      pointsEqual(v, superTriangle.a) ||
      pointsEqual(v, superTriangle.b) ||
      pointsEqual(v, superTriangle.c);

    return triangulation.filter(
      tri => !isSuperVertex(tri.a) && !isSuperVertex(tri.b) && !isSuperVertex(tri.c)
    );
  }

  public static extractUniqueEdges(triangles: Triangle[]): Edge[] {
    const unique: Edge[] = [];
    for (const tri of triangles) {
      const edges: Edge[] = [
        { u: tri.a, v: tri.b },
        { u: tri.b, v: tri.c },
        { u: tri.c, v: tri.a }
      ];
      for (const e of edges) {
        if (!unique.some(ue => edgeEquals(ue, e))) {
          const dx = e.u.x - e.v.x;
          const dy = e.u.y - e.v.y;
          unique.push({ ...e, weight: Math.sqrt(dx * dx + dy * dy) });
        }
      }
    }
    return unique;
  }

  public static computeMinimumSpanningTree(points: Vector2D[]): Edge[] {
    const triangles = this.triangulate(points);
    const edges = this.extractUniqueEdges(triangles);
    edges.sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0));

    const parent = new Map<string, string>();
    const key = (p: Vector2D) => `${p.x.toFixed(6)},${p.y.toFixed(6)}`;

    const find = (i: string): string => {
      if (!parent.has(i)) parent.set(i, i);
      if (parent.get(i) === i) return i;
      const root = find(parent.get(i)!);
      parent.set(i, root);
      return root;
    };

    const union = (i: string, j: string): boolean => {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) {
        parent.set(rootI, rootJ);
        return true;
      }
      return false;
    };

    const mst: Edge[] = [];
    for (const edge of edges) {
      const uKey = key(edge.u);
      const vKey = key(edge.v);
      if (union(uKey, vKey)) {
        mst.push(edge);
        if (mst.length === points.length - 1) break;
      }
    }

    return mst;
  }
}
