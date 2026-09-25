/**
 * Graham Scan Convex Hull & Spatial Polygon Metrics
 * Calculates the minimal convex boundary polygon enclosing a collection of travel destinations.
 * Provides centroid, perimeter, surface area, and ray-casting point inclusion checks.
 */

export interface HullPoint {
  x: number;
  y: number;
  label?: string;
}

export function crossProduct(o: HullPoint, a: HullPoint, b: HullPoint): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

export function computeConvexHull(points: HullPoint[]): HullPoint[] {
  if (points.length <= 2) {
    return [...points];
  }

  const sorted = [...points].sort((a, b) => {
    if (a.x === b.x) return a.y - b.y;
    return a.x - b.x;
  });

  const lower: HullPoint[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: HullPoint[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

export function computePolygonArea(polygon: HullPoint[]): number {
  const n = polygon.length;
  if (n < 3) return 0;

  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  return Math.abs(area) / 2.0;
}

export function computePolygonPerimeter(polygon: HullPoint[]): number {
  const n = polygon.length;
  if (n < 2) return 0;

  let perimeter = 0;
  for (let i = 0; i < n; i++) {
    const next = polygon[(i + 1) % n];
    const dx = next.x - polygon[i].x;
    const dy = next.y - polygon[i].y;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  return perimeter;
}

export function computePolygonCentroid(polygon: HullPoint[]): HullPoint {
  const n = polygon.length;
  if (n === 0) return { x: 0, y: 0 };
  if (n === 1) return { x: polygon[0].x, y: polygon[0].y };
  if (n === 2) return { x: (polygon[0].x + polygon[1].x) / 2, y: (polygon[0].y + polygon[1].y) / 2 };

  let cx = 0;
  let cy = 0;
  let signedArea = 0;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const factor = polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
    signedArea += factor;
    cx += (polygon[i].x + polygon[j].x) * factor;
    cy += (polygon[i].y + polygon[j].y) * factor;
  }

  signedArea /= 2;
  if (Math.abs(signedArea) < 1e-9) {
    let sx = 0;
    let sy = 0;
    for (const p of polygon) {
      sx += p.x;
      sy += p.y;
    }
    return { x: sx / n, y: sy / n };
  }

  const factor = 1 / (6 * signedArea);
  return { x: cx * factor, y: cy * factor };
}

export function isPointInsidePolygon(point: HullPoint, polygon: HullPoint[]): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
